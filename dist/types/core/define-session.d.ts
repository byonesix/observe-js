import type { Uuid } from './model';
export type SessionStep<Screen extends string, Action extends string> = `screen:${Screen}` | `action:${Action}` | 'end:completed' | 'end:left';
export interface SessionDefinition<Screen extends string, Action extends string> {
    readonly type: string;
    readonly steps: readonly SessionStep<Screen, Action>[];
    readonly abandonAfterMs?: number;
    readonly concurrent?: boolean;
}
export interface ActionOptions {
    readonly variant?: string;
    readonly value?: number;
}
export interface EndOptions {
    readonly value?: number;
    readonly currency?: string;
}
export type SessionHeaders = {
    readonly traceparent: string;
    readonly baggage: string;
};
export interface Session<Screen extends string = string, Action extends string = string, Reason extends string = string> {
    readonly id: string;
    screen(name: Screen): void;
    action(name: Action, options?: ActionOptions): void;
    complete(reason?: Reason, options?: EndOptions): void;
    leave(reason: Reason, options?: EndOptions): void;
    headers(): SessionHeaders | Readonly<Record<string, never>>;
}
export interface SessionKind<Screen extends string = string, Action extends string = string, Reason extends string = string> {
    start(): Session<Screen, Action, Reason>;
    current(): Session<Screen, Action, Reason> | null;
}
export declare function sessionHeaders(id: string): SessionHeaders;
export declare function localAmbient(): Uuid | undefined;
export declare function currentSessionHeaders(): Readonly<Record<string, string>>;
export declare function defineSession<Screen extends string = string, Action extends string = string, Reason extends string = string>(definition: SessionDefinition<NoInfer<Screen>, NoInfer<Action>>): SessionKind<Screen, Action, Reason>;
