import { Component, type ErrorInfo, type ReactNode } from 'react';
export interface FallbackProps {
    readonly error: unknown;
    readonly reset: () => void;
}
export interface ErrorBoundaryProps {
    readonly fallback: ReactNode | ((props: FallbackProps) => ReactNode);
    readonly onError?: (error: unknown, info: ErrorInfo) => void;
    readonly children?: ReactNode;
}
type ErrorBoundaryState = {
    readonly caught: false;
} | {
    readonly caught: true;
    readonly error: unknown;
};
export declare class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState;
    static getDerivedStateFromError(error: unknown): ErrorBoundaryState;
    componentDidCatch(error: unknown, info: ErrorInfo): void;
    private readonly reset;
    render(): ReactNode;
}
export {};
