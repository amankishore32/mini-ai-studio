import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRetry } from "../src/hooks/useRetry";

describe("useRetry Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute function successfully", async () => {
    const { result } = renderHook(() => useRetry());
    const mockFn = vi.fn().mockResolvedValue("success");

    let output: string = "";
    await act(async () => {
      output = await result.current.execute(mockFn);
    });

    expect(output).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe(null);
  });

  it("should retry on failure with exponential backoff", async () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 2, baseDelay: 100, maxDelay: 500 }));
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValueOnce("success");

    let output: string = "";
    await act(async () => {
      output = await result.current.execute(mockFn);
    });

    expect(output).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it("should throw error after max retries", async () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 1, baseDelay: 10 }));
    const mockFn = vi.fn().mockRejectedValue(new Error("Persistent failure"));

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.execute(mockFn);
      } catch (err) {
        thrownError = err as Error;
      }
    });

    expect((thrownError as unknown as Error)?.message).toBe("Persistent failure");
    expect(mockFn).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
  });

  it("should handle abort signal", async () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 3, baseDelay: 50 }));
    const mockFn = vi.fn().mockRejectedValue(new Error("Will fail"));
    const abortController = new AbortController();

    let thrownError: DOMException | null = null;
    await act(async () => {
      setTimeout(() => abortController.abort(), 10);
      try {
        await result.current.execute(mockFn, abortController.signal);
      } catch (err) {
        thrownError = err as DOMException;
      }
    });

    expect((thrownError as unknown as DOMException)?.name).toBe("AbortError");
  });

  it("should reset state", async () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 1 }));
    const mockFn = vi.fn().mockRejectedValue(new Error("Fail"));

    await act(async () => {
      try {
        await result.current.execute(mockFn);
      } catch {
        // Expected to fail after max retries
      }
    });

    expect(result.current.retryCount).toBe(2); // Attempted twice (0 and 1)

    await act(() => {
      result.current.reset();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.error).toBe(null);
  });
});
