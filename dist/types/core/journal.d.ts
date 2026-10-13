import type { Clock, JournalLine, Micros, SegmentClass, Uuid } from './model';
export type SegmentState = 'open' | 'sealed';
export interface SegmentName {
    readonly batchId: Uuid;
    readonly class: SegmentClass;
}
export interface StoredSegment {
    readonly key: string;
    readonly name: SegmentName;
    readonly state: SegmentState;
}
export interface SegmentWriter {
    append(text: string): void;
    sync(): Promise<void>;
    syncNow(): void;
    close(): Promise<void>;
}
export interface SegmentStore {
    create(key: string, firstLine: string): SegmentWriter;
    list(): Promise<ReadonlyArray<{
        readonly key: string;
        readonly bytes: number;
    }>>;
    names(): Promise<readonly string[]>;
    read(key: string): Promise<string | null>;
    rename(from: string, to: string): Promise<'done' | 'missing'>;
    remove(key: string): Promise<void>;
}
export declare function segmentKey(name: SegmentName, state: SegmentState): string;
export declare function parseSegmentKey(key: string): {
    readonly name: SegmentName;
    readonly state: SegmentState;
} | null;
export interface Batch {
    readonly name: SegmentName;
    readonly resourceJson: string;
    readonly lines: readonly string[];
    readonly skipped: number;
}
export type ReadResult = {
    readonly kind: 'batch';
    readonly batch: Batch;
} | {
    readonly kind: 'corrupt';
} | {
    readonly kind: 'future';
};
export declare function readBatch(name: SegmentName, text: string): ReadResult;
export declare function encodeEnvelope(batch: Batch, sentAtUs: Micros): string;
export interface JournalPolicy {
    readonly sealAfterMs: Readonly<Record<SegmentClass, number>>;
    readonly maxItems: number;
    readonly maxSegmentBytes: number;
    readonly syncEveryMs: number;
    readonly orphanAfterMs: number;
    readonly maxAgeMs: number;
    readonly capBytes: number;
    readonly capFiles: number;
}
export declare const JOURNAL_POLICY: JournalPolicy;
export interface Drops {
    evicted: number;
    expired: number;
    corrupt: number;
    failed: number;
}
export declare class Journal {
    private readonly store;
    private readonly resourceJson;
    private readonly policy;
    private readonly clock;
    private readonly open;
    private readonly mine;
    private readonly held;
    private readonly future;
    private readonly sealing;
    private readonly bornMono;
    private readonly torn;
    private maintaining;
    private drops;
    constructor(store: SegmentStore, resourceJson: string, policy: JournalPolicy, clock: Clock);
    append(cls: SegmentClass, line: JournalLine): void;
    tick(): void;
    sealAll(): Promise<void>;
    syncAllNow(): void;
    maintain(orphanAfterMs: number): Promise<void>;
    sendable(): Promise<readonly StoredSegment[]>;
    hold(segment: StoredSegment): void;
    release(segment: StoredSegment): void;
    load(segment: StoredSegment): Promise<Batch | null>;
    remove(segment: StoredSegment): Promise<void>;
    takeDrops(): Drops;
    private create;
    private scheduleSync;
    private sync;
    private seal;
    private finishSeal;
    private forget;
    private owned;
    private sweep;
    private discard;
    private adopt;
}
