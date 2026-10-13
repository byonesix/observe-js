import type { AttributeInput, Clock, ErrorDraft, Level, LogDraft, Mechanism } from './model';
export interface DraftEnv {
    readonly clock: Clock;
}
export interface ErrorHow {
    readonly mechanism: Mechanism;
    readonly handled: boolean;
    readonly attributes?: AttributeInput;
    readonly context?: Record<string, unknown>;
    readonly groupingKey?: string;
}
export declare function errorDraft(error: unknown, how: ErrorHow, env: DraftEnv): ErrorDraft;
export interface LogCall {
    readonly level: Level;
    readonly args: readonly unknown[];
    readonly channel?: string;
    readonly wallMs?: number;
    readonly attributes?: AttributeInput;
    readonly context?: Record<string, unknown>;
}
export declare function fromLogCall(call: LogCall, env: DraftEnv): readonly [LogDraft] | readonly [LogDraft, ErrorDraft];
export declare function channelOf(message: string): string | undefined;
