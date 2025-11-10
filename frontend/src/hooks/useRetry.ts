import { useState, useCallback } from "react";

interface UseRetryOptions {
  maxRetries?: number;
  baseDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
}

interface UseRetryReturn {
  isRetrying: boolean;
  retryCount: number;
  error: string | null;
  reset: () => void;
  execute: <T>(fn: () => Promise<T>, signal?: AbortSignal) => Promise<T>;
}

/**
 * Hook for retrying async operations with exponential backoff.
 * Calculates delay as: min(baseDelay * 2^retryCount, maxDelay)
 */
export const useRetry = ({
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000,
}: UseRetryOptions = {}): UseRetryReturn => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setRetryCount(0);
    setError(null);
    setIsRetrying(false);
  }, []);

  const execute = useCallback(
    async <T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // Check if abort signal is already aborted
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        try {
          setIsRetrying(attempt > 0);
          const result = await fn();
          reset();
          return result;
        } catch (err) {
          // Don't retry on abort
          if (err instanceof DOMException && err.name === "AbortError") {
            throw err;
          }

          lastError = err instanceof Error ? err : new Error(String(err));
          setRetryCount(attempt + 1);
          setError(lastError.message);

          // Don't delay after the last attempt or on abort
          if (attempt < maxRetries) {
            const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
            try {
              await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(resolve, delay);
                signal?.addEventListener("abort", () => {
                  clearTimeout(timeoutId);
                  reject(new DOMException("Aborted", "AbortError"));
                });
              });
            } catch (err) {
              if (err instanceof DOMException && err.name === "AbortError") {
                throw err;
              }
            }
          }
        }
      }

      setIsRetrying(false);
      throw lastError;
    },
    [maxRetries, baseDelay, maxDelay, reset]
  );

  return {
    isRetrying,
    retryCount,
    error,
    reset,
    execute,
  };
};
