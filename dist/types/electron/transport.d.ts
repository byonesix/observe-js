import type { Transport } from '../core/delivery';
export type FetchLike = (url: string, init: {
    method: string;
    headers: Record<string, string>;
    body: Uint8Array;
    signal: AbortSignal;
    redirect: 'manual';
}) => Promise<{
    readonly status: number;
    readonly headers: {
        get(name: string): string | null;
    };
    arrayBuffer(): Promise<ArrayBuffer>;
}>;
export declare function parseRetryAfter(value: string | null, nowMs: number): number | undefined;
export declare function sessionTransport(endpoint: string, key: string, fetcher: () => Promise<FetchLike>): Transport;
