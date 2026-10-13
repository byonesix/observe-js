# @byonesix/observe

Sends errors and logs from an Electron app to Observe. Everything the app captures is written to disk before the capture call returns, and stays there until Observe accepts it. Data survives crashes, `kill -9`, `app.exit()`, updates and days offline.

## Requirements

- Electron 28 or later. Tested on Electron 34.
- React 18 or later for the error boundary (optional).
- electron-log 5 for log forwarding (optional).

## Install

```sh
bun add github:byonesix/observe-js#v0.1.0
```

This adds the package to `dependencies`. Keep it there, not in `devDependencies`: electron-builder packs only `dependencies`, and the main process loads the package from `node_modules` at runtime. The tag contains the built files, so no install script runs.

## Set up

Three files, one call each.

In the main process, as early as possible:

```ts
import log from 'electron-log/main'
import * as observe from '@byonesix/observe/electron/main'

observe.init({
  endpoint: 'https://observe.example.com/ingest/v1',
  key: 'obk_...',
  service: 'my-app',
  logs: { from: 'electron-log', log },
})
log.initialize()
```

In the preload script:

```ts
import { exposeObserve } from '@byonesix/observe/electron/preload'

exposeObserve()
```

In the renderer entry:

```tsx
import * as observe from '@byonesix/observe/electron/renderer'
import { ErrorBoundary } from '@byonesix/observe/react'

observe.init()

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary fallback={({ reset }) => <CrashScreen onRetry={reset} />}>
    <App />
  </ErrorBoundary>,
)
```

The renderer never talks to the network. It hands errors and logs to the main process, which scrubs them, writes them to disk and sends them.

## What it captures

| Source | Becomes |
| --- | --- |
| An uncaught exception in main | an error, mechanism `uncaught` |
| An unhandled rejection in main or a renderer | an error, mechanism `unhandledrejection` |
| An `error` event in a window | an error, mechanism `onerror` |
| A render error caught by `ErrorBoundary` | an error, mechanism `error_boundary`, with the component stack |
| `render-process-gone` and `child-process-gone`, except a clean exit | an error, mechanism `process_gone`, with the reason and exit code |
| electron-log calls in main and renderers, at `info` and above (set `logs.level` to change it) | logs; a leading tag such as `[PRINT]` becomes the channel `print` |
| An electron-log call at `error` with an `Error` argument | a log and an error, linked |
| `captureException(error)` | an error, mechanism `report` |

Each item carries `process.kind`, `main` or `renderer`. The SDK only observes: it never changes whether the app keeps running or exits, and Electron's own error dialog behaves as before.

## Context

```ts
observe.setAttributes({ location_id: '412', 'user.id': '31' })
```

Call it from main or from a renderer. Both write the same attributes. `null` or `undefined` removes a key. Every error and log captured afterwards carries them.

## Report an error you handled

```ts
try {
  await printReceipt(order)
} catch (error) {
  observe.captureException(error, { attributes: { 'printer.model': 'tm-m30' }, context: { orderId: order.id } })
}
```

`captureException` returns the error's id, or `undefined` when the SDK dropped it.

## Log without electron-log

```ts
observe.log('warning', 'Printer offline', { channel: 'print', context: { printer } })
```

To capture `console` calls instead of electron-log, pass `logs: { from: 'console', levels: ['warning', 'error'] }` to `init`. Use one or the other.

## Flush

Nothing is lost if you skip this. To send pending data before a restart:

```ts
await observe.flush({ timeoutMs: 3000 })
```

To only make everything durable on disk, without waiting for the network:

```ts
await observe.flush({ send: false })
app.relaunch()
app.exit(0)
```

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `endpoint` | required | The ingest URL. |
| `key` | required | A client key. An empty key or endpoint turns the SDK off. |
| `service` | required | The service name. |
| `release` | `app.getVersion()` | The release each event belongs to. |
| `channel` | none | Sent as the `release.channel` attribute. |
| `revision` | none | Sent as the `vcs.revision` attribute. |
| `attributes` | none | Attributes set from the start. |
| `logs` | none | `{ from: 'electron-log', log, level? }` or `{ from: 'console', levels? }`. |
| `scrub.keys` | none | Extra keys whose values are scrubbed. |
| `dir` | `<userData>/observe` | Where the queue and the install id live. |

## Scrubbing

Values are scrubbed in the main process before they touch disk, in messages, log arguments, context and attributes. The scrubber replaces values under secret keys such as `password`, `token` and `authorization`, known token formats such as bearer tokens and API keys, card numbers, and URL credentials and secret-looking URL segments. It does not scrub other values, such as one-time codes or email addresses: do not log those. Add your own keys with `scrub.keys`, for example `scrub: { keys: ['passcode'] }`.

## Sandboxed preloads

With `sandbox: true`, a preload cannot `require` packages from `node_modules`. Bundle this package into the preload instead. In electron-vite: `externalizeDepsPlugin({ exclude: ['@byonesix/observe'] })`.

## How data reaches Observe

- The queue lives in `<userData>/observe/queue`. Each file is one envelope: errors are sent about 1 second after capture, logs about every 30 seconds.
- An error is flushed to the storage device right after it is written, logs at least every 5 seconds. A power cut loses at most the last 5 seconds of logs.
- The queue keeps at most 50 MB or 2,000 files, dropping the oldest logs first, and drops data older than 6 days.
- A failed send backs off from 5 seconds to 5 minutes. A rejected key pauses sending for an hour. Observe's `Retry-After` is honoured. Nothing is deleted because of a wrong endpoint.
- Retries reuse the same batch id, which Observe uses to drop a duplicate insert.

## Power-cut checklist (Raspberry Pi)

Run this by hand on a Pi before a release that changes the queue. Use a test environment and a client key for it.

1. Build a test app that logs a counter every 100 ms and calls `captureException(new Error('tick N'))` every 10 seconds, with the counter in the context.
2. Start it on the Pi with the network up. Wait one minute and check that the counters arrive in Observe.
3. Pull the power plug. Note the last counter visible on screen, or in `~/.config/<app>/logs/main.log` after boot.
4. Power the Pi on. Let the app start and wait one minute.
5. Check in Observe:
   - every error captured before the cut arrived;
   - every log older than 5 seconds before the cut arrived;
   - no counter appears twice;
   - `<userData>/observe/queue` is empty.
6. Repeat steps 3 to 5 twenty times, including cuts during a send and cuts within one second of an error.
7. Repeat once with the network unplugged before the cut, and plug it in after boot.

Report any loss beyond the last 5 seconds of logs, any duplicate, and any file left in the queue.
