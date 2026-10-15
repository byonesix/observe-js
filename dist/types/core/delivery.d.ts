import { type Journal } from './journal';
import type { Clock } from './model';
export interface HttpReply {
    readonly status: number;
    readonly retryAfterSeconds?: number;
    readonly dateMs?: number;
}
export interface Transport {
    post(json: string, timeoutMs: number): Promise<HttpReply>;
}
export type Outcome = {
    readonly kind: 'accepted';
} | {
    readonly kind: 'rejected';
    readonly status: number;
} | {
    readonly kind: 'unauthorized';
} | {
    readonly kind: 'throttled';
    readonly retryAfterMs: number | undefined;
} | {
    readonly kind: 'failed';
};
export declare function classify(reply: HttpReply | 'network-error'): Outcome;
export type Health = {
    readonly kind: 'healthy';
} | {
    readonly kind: 'backing-off';
    readonly failures: number;
    readonly untilMs: number;
} | {
    readonly kind: 'paused';
    readonly reason: 'unauthorized' | 'throttled';
    readonly failures: number;
    readonly untilMs: number;
};
export interface DeliveryPolicy {
    readonly baseBackoffMs: number;
    readonly maxBackoffMs: number;
    readonly unauthorizedPauseMs: number;
    readonly maxRetryAfterMs: number;
    readonly timeoutMs: number;
}
export declare const DELIVERY_POLICY: DeliveryPolicy;
export declare const MAX_TIMER_MS: number;
export declare function nextHealth(health: Health, outcome: Outcome, nowMs: number, jitter: number, policy: DeliveryPolicy): Health;
export interface Connectivity {
    online(): boolean;
}
export declare class Delivery {
    private readonly journal;
    private readonly transport;
    private readonly connectivity;
    private readonly policy;
    private readonly clock;
    private readonly random;
    private readonly serverTime;
    private health;
    private running;
    private rerun;
    private offline;
    private rejected;
    private readonly spacing;
    constructor(journal: Journal, transport: Transport, connectivity: Connectivity, policy: DeliveryPolicy, clock: Clock, random: () => number, serverTime?: (dateMs: number) => void);
    tick(): void;
    wake(): void;
    drain(deadlineMs: number): Promise<boolean>;
    takeRejected(): number;
    private allowed;
    private fresh;
    private start;
    private untilDeadline;
    private pump;
    private sending;
    private attempt;
    private post;
    private space;
}
