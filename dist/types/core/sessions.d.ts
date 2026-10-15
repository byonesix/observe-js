import type { EventItem, Owner, SessionMarker, SessionMessage, StepKey, Token, Uuid } from './model';
export declare const SESSION_LIMITS: {
    readonly open: 64;
    readonly events: 2000;
    readonly steps: 16;
    readonly typeBytes: 32;
    readonly minAbandonMs: 60000;
    readonly maxAbandonMs: number;
    readonly defaultAbandonMs: number;
    readonly maxOffsetMs: 4294967295;
};
export declare function parseToken(raw: unknown): Token | null;
export declare function parseSessionType(raw: unknown): Token | null;
export declare function parseSessionId(raw: unknown): Uuid | null;
export declare function parseStepKey(raw: unknown): StepKey | null;
export declare function parseSteps(raw: unknown): StepKey[] | null;
export declare function parseAbandonAfterMs(raw: unknown): number | null;
export declare function parseSessionMessage(value: unknown): SessionMessage | null;
export declare function parseMarker(value: unknown): SessionMarker | null;
export declare function interruptedItem(marker: SessionMarker): EventItem;
export declare class SessionRegistry {
    private readonly open;
    apply(owner: Owner, message: SessionMessage, nowMono: number): EventItem[];
    interrupt(owner: number, nowMono: number): EventItem[];
    attach(owner: Owner): Uuid | undefined;
    private start;
    private end;
    private at;
}
