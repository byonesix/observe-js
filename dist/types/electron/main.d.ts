import type { AttributeInput, Level } from '../core/model';
import { type ElectronLogLevel, type ElectronLogLike } from './hooks';
export { currentSessionHeaders, defineSession } from '../core/define-session';
export type { ActionOptions, EndOptions, Session, SessionDefinition, SessionHeaders, SessionKind, SessionStep } from '../core/define-session';
export { captureException, flush, log, setAttributes } from '../core/hub';
export type { AttributeInput, CaptureOptions, FlushOptions, Level, LogOptions } from '../core/model';
export type { ElectronLogLevel, ElectronLogLike } from './hooks';
export type LogSource = {
    readonly from: 'electron-log';
    readonly log: ElectronLogLike;
    readonly level?: ElectronLogLevel;
} | {
    readonly from: 'console';
    readonly levels?: readonly Level[];
};
export interface InitOptions {
    readonly endpoint: string;
    readonly key: string;
    readonly service: string;
    readonly release?: string;
    readonly channel?: string;
    readonly revision?: string;
    readonly attributes?: AttributeInput;
    readonly logs?: LogSource;
    readonly scrub?: {
        readonly keys?: readonly string[];
    };
    readonly dir?: string;
}
export declare function init(options: InitOptions): void;
