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
    readonly session?: Uuid | null;
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
    readonly session?: Uuid | null;
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
export interface SessionRef {
    readonly id: string;
}
export interface CaptureOptions {
    readonly attributes?: AttributeInput;
    readonly context?: Record<string, unknown>;
    readonly handled?: boolean;
    readonly groupingKey?: string;
    readonly session?: SessionRef | null;
}
export interface LogOptions {
    readonly channel?: string;
    readonly attributes?: AttributeInput;
    readonly context?: Record<string, unknown>;
    readonly session?: SessionRef | null;
}
export type JournalLine = string & {
    readonly [brand]: 'JournalLine';
};
export type SegmentClass = 'errors' | 'logs' | 'events';
export type Token = string & {
    readonly [brand]: 'Token';
};
export type StepKey = string & {
    readonly [brand]: 'StepKey';
};
export type SessionResult = 'completed' | 'left';
export type Owner = number | 'main';
export type SessionMessage = {
    readonly op: 'start';
    readonly id: Uuid;
    readonly type: Token;
    readonly steps: readonly StepKey[];
    readonly abandonAfterMs: number;
    readonly concurrent: boolean;
} | {
    readonly op: 'screen';
    readonly id: Uuid;
    readonly name: Token;
} | {
    readonly op: 'action';
    readonly id: Uuid;
    readonly name: Token;
    readonly variant?: Token;
    readonly value?: number;
} | {
    readonly op: 'end';
    readonly id: Uuid;
    readonly result: SessionResult;
    readonly reason?: Token;
    readonly value?: number;
    readonly currency?: string;
};
interface EventAt {
    readonly session_id: Uuid;
    readonly session_type: Token;
    readonly seq: number;
    readonly offset_ms: number;
    readonly screen?: Token;
}
export type EventItem = (EventAt & {
    readonly kind: 'start';
    readonly steps: readonly StepKey[];
    readonly abandon_after_ms: number;
}) | (EventAt & {
    readonly kind: 'screen';
    readonly name: Token;
}) | (EventAt & {
    readonly kind: 'action';
    readonly name: Token;
    readonly variant?: Token;
    readonly value?: number;
}) | (EventAt & {
    readonly kind: 'end';
    readonly result: SessionResult;
    readonly reason?: Token;
    readonly value?: number;
    readonly currency?: string;
}) | {
    readonly kind: 'interrupted';
    readonly session_id: Uuid;
    readonly session_type: Token;
};
export interface SessionMarker {
    readonly id: Uuid;
    readonly type: Token;
    readonly attributes: Readonly<Record<string, string>>;
}
export interface FlushOptions {
    readonly timeoutMs?: number;
    readonly send?: boolean;
}
export {};
