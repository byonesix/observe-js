import type { Attributes, Draft, JournalLine, ProcessKind, Uuid } from './model';
import type { Scrubber } from './scrub';
export interface PrepareContext {
    readonly scope: Attributes;
    readonly scrubber: Scrubber;
    readonly roots: readonly string[];
    readonly session?: Uuid;
}
export declare function prepare(process: ProcessKind, draft: Draft, ctx: PrepareContext): JournalLine;
