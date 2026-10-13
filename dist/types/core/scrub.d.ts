import type { Json } from './model';
export declare const REPLACEMENT = "[scrubbed]";
export declare const DEFAULT_KEYS: readonly string[];
export declare class Scrubber {
    private readonly keys;
    private readonly verdicts;
    private decodes;
    constructor(keys: readonly string[]);
    static withDefaults(extra: readonly string[]): Scrubber;
    keyed(value: Json, parent?: string): Json;
    text(value: string, cards?: boolean): string;
    url(value: string): string;
    matchesKey(key: string, parent?: string): boolean;
    private walk;
    private item;
    private scrub;
    private encodedJson;
    private escapedText;
    private secretLists;
    private pairs;
    private colonValuesWithEquals;
    private matchesKeyAt;
    private decide;
}
