import type { Clock, Micros, Uuid } from './model';
export declare function uuidv7(wallMs: number): Uuid;
export declare function uuidv4(): Uuid;
export declare function uuidv7Ms(id: string): number | null;
export declare function micros(wallMs: number): Micros;
export declare const systemClock: Clock;
