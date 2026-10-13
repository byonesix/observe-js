import type { Frame, RawFrame } from './model';
export declare function parseV8Stack(stack: string): RawFrame[];
export declare function normalizeFrame(frame: RawFrame, roots: readonly string[]): Frame;
