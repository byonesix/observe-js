import type { MarkerStore } from '../core/client';
import type { OffsetStore } from '../core/clock';
import { type SegmentStore, type SegmentWriter } from '../core/journal';
import type { SessionMarker, Uuid } from '../core/model';
export declare class FsSegmentStore implements SegmentStore {
    private readonly dir;
    constructor(dir: string);
    create(key: string, firstLine: string): SegmentWriter;
    names(): Promise<readonly string[]>;
    list(): Promise<ReadonlyArray<{
        readonly key: string;
        readonly bytes: number;
    }>>;
    read(key: string): Promise<string | null>;
    rename(from: string, to: string): Promise<'done' | 'missing'>;
    remove(key: string): Promise<void>;
}
export declare function readOrCreateInstallId(dir: string): Uuid;
export interface MarkerOwner {
    readonly launch: string;
    readonly pid: number;
    readonly alive: (pid: number) => boolean;
}
export declare class FsMarkerStore implements MarkerStore {
    private readonly dir;
    private readonly owner;
    constructor(dir: string, owner: Partial<MarkerOwner> & Pick<MarkerOwner, 'launch'>);
    write(marker: SessionMarker): void;
    remove(id: Uuid): void;
    list(): readonly SessionMarker[];
}
export declare class FsOffsetStore implements OffsetStore {
    private readonly dir;
    constructor(dir: string);
    read(): number | null;
    write(offsetMs: number): void;
}
