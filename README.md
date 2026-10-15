# @byonesix/observe

Sends errors, logs and customer sessions from an Electron app to Observe. Everything the app captures is written to disk before the capture call returns, and stays there until Observe accepts it. Data survives crashes, `kill -9`, `app.exit()`, updates and days offline.

## Requirements

- Electron 28 or later. Tested on Electron 34.
- React 18 or later for the error boundary (optional).
- electron-log 5 for log forwarding (optional).

## Install

```sh
bun add github:byonesix/observe-js#v0.2.1
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

## Sessions

A session is one customer's visit, such as one customer placing an order. Define each session type once, in a window or in main:

```ts
import { defineSession } from '@byonesix/observe/electron/renderer'

type Screen = 'order_type' | 'menu' | 'payment'
type Action = 'order_type_chosen' | 'item_added' | 'payment_method_chosen'
type Reason = 'next_order_tap' | 'idle_timeout' | 'customer_cancel'

export const order = defineSession<Screen, Action, Reason>({
  type: 'order',
  steps: ['screen:order_type', 'action:item_added', 'screen:payment', 'end:completed'],
  abandonAfterMs: 10 * 60_000,
})
```

Start a session when a customer starts, and report what they see and do:

```ts
const session = order.start()
session.screen('order_type')
session.action('order_type_chosen', { variant: 'eat_in' })
session.screen('menu')
session.action('item_added', { variant: 'popular', value: 12.5 })
session.screen('payment')
session.action('payment_method_chosen', { variant: 'card' })
session.complete('next_order_tap', { value: 18.4, currency: 'EUR' })
```

Code that does not hold the session finds it with `current()`, which returns the open session of that type or `null`:

```ts
order.current()?.leave('idle_timeout')
```

- `steps` is the Journey funnel in Observe, in order. A step is `screen:<name>`, `action:<name>`, `end:completed` or `end:left`. The type parameters make TypeScript reject a step, screen, action or reason the app did not declare. Without them, any name is accepted.
- Names, variants and reasons match `^[a-z0-9_]{1,64}$`, and `type` matches `^[a-z0-9_]{1,32}$`. A call with another value does nothing and prints a warning once. `abandonAfterMs` is 1 minute to 24 hours, and 10 minutes when you leave it out.
- `complete(reason?, { value?, currency? })` ends the session as completed. `leave(reason, { value?, currency? })` ends it as left and needs a reason. A currency needs a value. After the end, calls on the session do nothing.
- `start()` ends the open session of the same type in the same window as left, with the reason `superseded`. Set `concurrent: true` for a type whose sessions overlap, such as several orders being prepared at once. A concurrent session is never linked to errors and logs on its own.
- A window or main holds at most 64 open sessions, and a session takes at most 2,000 events, always keeping room for its end. A session that could not open has no headers and never links errors. Screens and actions share a limit of 200 at once and 20 a second per process. Starts and ends are never limited.
- Every error and log captured while a session is open carries its `session_id`. In a window, that is the newest session the window started. In main, it is the newest session of any window. Pass `{ session }` to `captureException` or `log` to name one, or `{ session: null }` for none.
- When a window reloads, navigates or crashes, main ends the sessions it started as left, with the reason `interrupted`. When the app is killed or loses power, the next launch ends them the same way. A second instance of the app leaves the sessions of a first instance that is still running alone. A session that nobody ends shows as unfinished in Observe once `abandonAfterMs` passes without an event.
- Main numbers each event and times it on a monotonic clock, so a wrong system clock does not change durations. The SDK also corrects its wall clock by the `Date` header of Observe's replies when the two differ by more than 2 seconds, and uses the corrected clock for session ids and item times.

### Link API calls to the session

To show your API's requests in a session's timeline, send the session's headers with each call:

```ts
await fetch(`${api}/orders/${orderId}/pay`, { method: 'POST', headers: { ...session.headers(), 'content-type': 'application/json' }, body })
```

`session.headers()` returns a W3C `traceparent` that starts a new trace on each call, and `baggage: observe.session=<session id>`. The trace is not marked sampled, so the API's own sampling decides whether to keep its spans. Observe links the request to the session either way. An API client that does not hold the session can call `currentSessionHeaders()` instead. It returns the headers of the session that errors would link to, or `{}` when no session is open:

```ts
import { currentSessionHeaders } from '@byonesix/observe/electron/renderer'

const response = await fetch(url, { headers: { ...currentSessionHeaders(), authorization: `Bearer ${token}` } })
```

A Laravel API with `byonesix/observe-laravel` continues the trace and sends the request, its spans, errors and logs with the session's id. If a window calls the API from another origin, allow the `traceparent` and `baggage` request headers in the API's CORS configuration.

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

- The queue lives in `<userData>/observe/queue`. Each file is one envelope: errors are sent about 1 second after capture, logs about every 30 seconds, and session events about every 30 seconds and at once when a session ends.
- Each open session has a file in `<userData>/observe/sessions` until its end is on disk. The next launch ends the sessions it finds there as interrupted.
- An error is flushed to the storage device right after it is written, logs at least every 5 seconds. A power cut loses at most the last 5 seconds of logs.
- The queue keeps at most 50 MB or 2,000 files, dropping the oldest logs first, then session events, then errors, and drops data older than 6 days.
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
