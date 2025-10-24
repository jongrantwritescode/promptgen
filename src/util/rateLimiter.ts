// Rate limiting and retry utilities
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff with jitter
export const exponentialBackoff = async (
  attempt: number,
  baseDelay: number = 1000
): Promise<void> => {
  const maxDelay = 30000; // 30 seconds max
  const jitter = Math.random() * 1000; // Add up to 1 second of jitter
  const delay = Math.min(baseDelay * Math.pow(2, attempt) + jitter, maxDelay);

  console.log(
    `        🔄 Exponential backoff attempt ${attempt + 1}: waiting ${Math.ceil(
      delay / 1000
    )} seconds...`
  );
  await sleep(delay);
};

// Retry wrapper with exponential backoff
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a rate limit error
      if (
        error instanceof Error &&
        (error.message.includes("rate") ||
          error.message.includes("429") ||
          error.message.includes("quota") ||
          error.message.includes("Rate limit exceeded"))
      ) {
        if (attempt < maxRetries - 1) {
          await exponentialBackoff(attempt, baseDelay);
          continue;
        }
      }

      // For non-rate-limit errors, don't retry
      throw error;
    }
  }

  throw lastError!;
};

// Rate limiter to ensure we stay under 500 requests/minute
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 450; // Stay well under 500
  private readonly windowMs = 60 * 1000; // 1 minute

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();

    // Remove requests older than 1 minute
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest) + 1000; // Add 1 second buffer

      if (waitTime > 0) {
        console.log(
          `        ⏳ Rate limit: waiting ${Math.ceil(
            waitTime / 1000
          )} seconds...`
        );
        await sleep(waitTime);
      }
    }

    this.requests.push(now);
  }
}
