import { type ErrorHow, type LogCall } from './capture';
import { type Delivery } from './delivery';
import { type Hub } from './hub';
import type { Journal } from './journal';
import type { AttributeInput, Clock, Draft, FlushOptions, JournalLine, Owner, ProcessKind, SessionMarker, SessionMessage, Uuid } from './model';
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
    readonly events: Bucket;
    readonly duplicateWindowMs: number;
    readonly maintainEveryMs: number;
    readonly orphanAfterMs: number;
    readonly dropReportEveryMs: number;
    readonly warnEveryMs: number;
    readonly flushTimeoutMs: number;
}
export declare const CLIENT_POLICY: ClientPolicy;
export interface MarkerStore {
    write(marker: SessionMarker): void;
    remove(id: Uuid): void;
    list(): readonly SessionMarker[];
}
export interface ClientDeps {
    readonly journal: Pick<Journal, 'append' | 'seal' | 'tick' | 'sealAll' | 'syncAllNow' | 'maintain' | 'takeDrops'>;
    readonly markers: MarkerStore;
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
    private readonly sessions;
    constructor(deps: ClientDeps);
    get clock(): Clock;
    record(process: ProcessKind, draft: Draft, owner?: Owner): boolean;
    submit(draft: Draft): boolean;
    session(message: SessionMessage): boolean;
    sessionMessage(process: ProcessKind, owner: Owner, message: SessionMessage): boolean;
    interrupt(owner: number): void;
    ambient(): Uuid | undefined;
    recover(): Promise<void>;
    captureError(process: ProcessKind, error: unknown, how: ErrorHow, owner?: Owner): string | undefined;
    logCall(process: ProcessKind, call: LogCall, owner?: Owner): void;
    setAttributes(input: AttributeInput): void;
    syncNow(): void;
    tick(): void;
    flush(options?: FlushOptions): Promise<boolean>;
    private buildScope;
    private write;
    private writeEvents;
    private mark;
    private take;
    private guard;
    private remember;
    private collectDrops;
    private warn;
}
