import type { App } from 'electron';
import type { ErrorHow, LogCall } from '../core/capture';
import type { ErrorDraft, Level, ProcessKind } from '../core/model';
export interface HookClient {
    captureError(process: ProcessKind, error: unknown, how: ErrorHow): string | undefined;
    record(process: ProcessKind, draft: ErrorDraft): boolean;
    logCall(process: ProcessKind, call: LogCall): void;
    syncNow(): void;
}
export type ProcessLike = Pick<NodeJS.Process, 'on' | 'execArgv' | 'env' | 'pid'>;
export type AppLike = Pick<App, 'on'>;
type Warn = (...args: unknown[]) => void;
export declare function rejectionsAreStrict(proc: Pick<NodeJS.Process, 'execArgv' | 'env'>): boolean;
export declare function installProcessHandlers(client: HookClient, proc: ProcessLike, warn: Warn): void;
export declare function installAppHandlers(client: HookClient, app: AppLike): void;
export interface ElectronLogLike {
    transports: Record<string, unknown>;
}
export type ElectronLogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
export declare function reviveStack(value: unknown): unknown;
export declare function attachElectronLog(client: HookClient, log: ElectronLogLike, level?: ElectronLogLevel): void;
export declare const DEFAULT_CONSOLE_LEVELS: readonly Level[];
export declare function captureConsole(target: Console, sink: (call: LogCall) => void, levels?: readonly Level[]): void;
export {};
