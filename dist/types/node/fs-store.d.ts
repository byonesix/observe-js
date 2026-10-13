import { type SegmentStore, type SegmentWriter } from '../core/journal';
import type { Uuid } from '../core/model';
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
