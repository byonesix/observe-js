import type { Clock } from './model';
export interface OffsetStore {
    read(): number | null;
    write(offsetMs: number): void;
}
export declare const CLOCK_POLICY: {
    readonly samples: 5;
    readonly minOffsetMs: 2000;
    readonly dateResolutionMs: 1000;
};
export declare class CorrectedClock implements Clock {
    private readonly base;
    private readonly store;
    private readonly changed;
    private offset;
    private readonly samples;
    constructor(base: Clock, store: OffsetStore, changed?: (offsetMs: number) => void);
    wallMs(): number;
    monoMs(): number;
    offsetMs(): number;
    observe(serverDateMs: number): void;
}
export declare function offsetClock(base: Clock, offsetMs: () => number): Clock;
