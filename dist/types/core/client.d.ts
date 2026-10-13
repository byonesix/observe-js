import { type ErrorHow, type LogCall } from './capture';
import { type Delivery } from './delivery';
import { type Hub } from './hub';
import type { Journal } from './journal';
import type { AttributeInput, Clock, Draft, FlushOptions, JournalLine, ProcessKind } from './model';
import { type PrepareContext } from './prepare';
import type { Scrubber } from './scrub';
export type Warn = (message: string, error?: unknown) => void;
export interface Bucket {
    readonly burst: number;
    readonly perSecond: number;
}
export interface ClientPolicy {
    readonly errors: Bucket;
    readonly logs: Bucket;
    readonly duplicateWindowMs: number;
    readonly maintainEveryMs: number;
    readonly orphanAfterMs: number;
    readonly dropReportEveryMs: number;
    readonly warnEveryMs: number;
    readonly flushTimeoutMs: number;
}
export declare const CLIENT_POLICY: ClientPolicy;
export interface ClientDeps {
    readonly journal: Pick<Journal, 'append' | 'tick' | 'sealAll' | 'syncAllNow' | 'maintain' | 'takeDrops'>;
    readonly delivery: Pick<Delivery, 'tick' | 'drain' | 'takeRejected'>;
    readonly scrubber: Scrubber;
    readonly roots: readonly string[];
    readonly clock: Clock;
    readonly scope?: AttributeInput;
    readonly warn: Warn;
    readonly policy?: ClientPolicy;
    readonly prepare?: (process: ProcessKind, draft: Draft, ctx: PrepareContext) => JournalLine;
}
export declare class Client implements Hub {
    private readonly deps;
    private readonly policy;
    private readonly prepareLine;
    private readonly scopeInput;
    private scope;
    private readonly buckets;
    private readonly recent;
    private drops;
    private lastDropReportMs;
    private lastMaintainMs;
    private lastWarnMs;
    private readonly env;
    constructor(deps: ClientDeps);
    record(process: ProcessKind, draft: Draft): boolean;
    submit(draft: Draft): boolean;
    captureError(process: ProcessKind, error: unknown, how: ErrorHow): string | undefined;
    logCall(process: ProcessKind, call: LogCall): void;
    setAttributes(input: AttributeInput): void;
    syncNow(): void;
    tick(): void;
    flush(options?: FlushOptions): Promise<boolean>;
    private buildScope;
    private write;
    private guard;
    private remember;
    private collectDrops;
    private warn;
}
