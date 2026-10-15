import { fromLogCall, type ErrorHow } from './capture';
import type { AttributeInput, CaptureOptions, Clock, Draft, FlushOptions, Level, LogOptions, SessionMessage, SessionRef, Uuid } from './model';
export interface Hub {
    readonly clock: Clock;
    submit(draft: Draft): boolean;
    session(message: SessionMessage): boolean;
    ambient(): Uuid | undefined;
    setAttributes(attributes: AttributeInput): void;
    flush(options: FlushOptions): Promise<boolean>;
}
export declare const MAX_PENDING = 100;
export declare const disabledHub: Hub;
export declare function installHub(hub: Hub): boolean;
export declare function currentHub(): Hub;
export declare function captureError(error: unknown, how: ErrorHow, hub?: Hub): string | undefined;
export declare function sessionOf(ref: SessionRef | null | undefined): Uuid | null | undefined;
export declare function captureException(error: unknown, options?: CaptureOptions): string | undefined;
export declare function submitLog(submit: (draft: Draft) => boolean, [log, linked]: ReturnType<typeof fromLogCall>): void;
export declare function log(level: Level, message: string, options?: LogOptions): void;
export declare function setAttributes(attributes: AttributeInput): void;
export declare function flush(options?: FlushOptions): Promise<boolean>;
