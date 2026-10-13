import type { Attributes, Draft, JournalLine, ProcessKind } from './model';
import type { Scrubber } from './scrub';
export interface PrepareContext {
    readonly scope: Attributes;
    readonly scrubber: Scrubber;
    readonly roots: readonly string[];
}
export declare function prepare(process: ProcessKind, draft: Draft, ctx: PrepareContext): JournalLine;
