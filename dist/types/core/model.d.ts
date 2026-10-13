export type Level = 'trace' | 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'alert' | 'emergency';
export declare const LEVELS: readonly Level[];
export type Mechanism = 'report' | 'uncaught' | 'unhandledrejection' | 'onerror' | 'error_boundary' | 'process_gone' | 'log';
export type ProcessKind = 'main' | 'renderer' | 'preload' | 'utility';
export type RuntimeName = 'electron' | 'browser';
declare const brand: unique symbol;
export type Uuid = string & {
    readonly [brand]: 'Uuid';
};
export type Micros = number & {
    readonly [brand]: 'Micros';
};
export type AttributeValue = string | number | boolean | null | undefined;
export type AttributeInput = Readonly<Record<string, AttributeValue>>;
export type Attributes = Readonly<Record<string, string>> & {
    readonly [brand]: 'Attributes';
};
export type Json = null | boolean | number | string | Json[] | {
    [key: string]: Json;
};
export type JsonObject = {
    [key: string]: Json;
};
export interface RawFrame {
    readonly function: string;
    readonly file?: string;
    readonly line?: number;
    readonly column?: number;
}
export interface Frame extends RawFrame {
    readonly in_app: boolean;
}
export interface ExceptionDraft {
    readonly type: string;
    readonly message: string;
    readonly code?: string;
    readonly frames: readonly RawFrame[];
}
export interface ErrorDraft {
    readonly kind: 'error';
    readonly id: Uuid;
    readonly time_us: Micros;
    readonly handled: boolean;
    readonly mechanism: Mechanism;
    readonly exceptions: readonly [ExceptionDraft, ...ExceptionDraft[]];
    readonly grouping_key?: string;
    readonly attributes: AttributeInput;
    readonly context: JsonObject;
}
export interface LogDraft {
    readonly kind: 'log';
    readonly id: Uuid;
    readonly time_us: Micros;
    readonly level: Level;
    readonly message: string;
    readonly args?: readonly Json[];
    readonly channel?: string;
    readonly error_id?: Uuid;
    readonly attributes: AttributeInput;
    readonly context: JsonObject;
}
export type Draft = ErrorDraft | LogDraft;
export interface Resource {
    readonly platform: 'javascript';
    readonly service: string;
    readonly release: string;
    readonly host: string;
    readonly sdk: {
        readonly name: 'observe-js';
        readonly version: string;
    };
    readonly runtime: {
        readonly name: RuntimeName;
        readonly version: string;
    };
    readonly attributes: Attributes;
}
export interface Clock {
    wallMs(): number;
    monoMs(): number;
}
export interface CaptureOptions {
    readonly attributes?: AttributeInput;
    readonly context?: Record<string, unknown>;
    readonly handled?: boolean;
    readonly groupingKey?: string;
}
export interface LogOptions {
    readonly channel?: string;
    readonly attributes?: AttributeInput;
    readonly context?: Record<string, unknown>;
}
export type JournalLine = string & {
    readonly [brand]: 'JournalLine';
};
export type SegmentClass = 'errors' | 'logs';
export interface FlushOptions {
    readonly timeoutMs?: number;
    readonly send?: boolean;
}
export {};
