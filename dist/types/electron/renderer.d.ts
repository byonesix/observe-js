export { currentSessionHeaders, defineSession } from '../core/define-session';
export type { ActionOptions, EndOptions, Session, SessionDefinition, SessionHeaders, SessionKind, SessionStep } from '../core/define-session';
export { captureException, flush, log, setAttributes } from '../core/hub';
export type { AttributeInput, CaptureOptions, FlushOptions, Level, LogOptions } from '../core/model';
export declare function init(): void;
