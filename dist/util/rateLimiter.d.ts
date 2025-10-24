export declare const sleep: (ms: number) => Promise<unknown>;
export declare const exponentialBackoff: (attempt: number, baseDelay?: number) => Promise<void>;
export declare const retryWithBackoff: <T>(operation: () => Promise<T>, maxRetries?: number, baseDelay?: number) => Promise<T>;
export declare class RateLimiter {
    private requests;
    private readonly maxRequests;
    private readonly windowMs;
    waitIfNeeded(): Promise<void>;
}
//# sourceMappingURL=rateLimiter.d.ts.map