import { type AttributeInput, type Draft, type FlushOptions, type Level, type SessionMessage } from '../core/model';
export declare const CHANNEL: {
    readonly post: "observe:v1:post";
    readonly hello: "observe:v1:hello";
    readonly flush: "observe:v1:flush";
    readonly clock: "observe:v1:clock";
};
export type BridgeMessage = {
    readonly t: 'draft';
    readonly draft: Draft;
} | {
    readonly t: 'attributes';
    readonly attributes: AttributeInput;
} | {
    readonly t: 'session';
    readonly session: SessionMessage;
};
export interface Hello {
    readonly enabled: boolean;
    readonly console: readonly Level[] | null;
    readonly clockOffsetMs: number;
}
export interface ObserveBridge {
    readonly version: 1;
    post(message: BridgeMessage): void;
    hello(): Promise<Hello>;
    flush(options: FlushOptions): Promise<boolean>;
    onClock?(listener: (offsetMs: number) => void): void;
}
export declare const BRIDGE_GLOBAL = "__observe";
export declare const MAX_MESSAGE_BYTES: number;
export declare const MAX_FLUSH_TIMEOUT_MS = 60000;
export declare function parseBridgeMessage(value: unknown): BridgeMessage | null;
export declare function parseFlushOptions(value: unknown): FlushOptions;
