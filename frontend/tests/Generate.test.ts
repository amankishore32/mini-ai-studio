import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGenerate } from "../src/hooks/useGenerate";
import API from "../src/services/api";

// Mock the API module
vi.mock("../src/services/api", () => ({
  default: {
    createGeneration: vi.fn(),
    listGenerations: vi.fn(),
  },
}));

// Mock useRetry hook
vi.mock("../src/hooks/useRetry", () => ({
  useRetry: () => ({
    error: null,
    execute: vi.fn((fn) => fn()),
  }),
}));

describe("useGenerate Hook", () => {
  const mockToken = "test_token_123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toBe(null);
    expect(result.current.generations).toEqual([]);
  });

  it("should fetch generations successfully", async () => {
    const mockGenerations = [
      {
        id: 1,
        imageUrl: "https://example.com/image1.jpg",
        prompt: "Test prompt 1",
        style: "realistic",
        createdAt: new Date().toISOString(),
        status: "COMPLETED" as const,
      },
      {
        id: 2,
        imageUrl: "https://example.com/image2.jpg",
        prompt: "Test prompt 2",
        style: "cartoon",
        createdAt: new Date().toISOString(),
        status: "COMPLETED" as const,
      },
    ];

    (API.listGenerations as ReturnType<typeof vi.fn>).mockResolvedValue(mockGenerations);

    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    await act(async () => {
      await result.current.fetchGenerations();
    });

    expect(API.listGenerations).toHaveBeenCalledWith(mockToken, 5);
    expect(result.current.generations).toEqual(mockGenerations);
  });

  it("should handle generation successfully", async () => {
    const mockGeneration = {
      id: 1,
      imageUrl: "https://example.com/generated.jpg",
      prompt: "A beautiful sunset",
      style: "realistic",
      createdAt: new Date().toISOString(),
      status: "COMPLETED" as const,
    };

    (API.createGeneration as ReturnType<typeof vi.fn>).mockResolvedValue(mockGeneration);

    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    await act(async () => {
      await result.current.handleGenerate("A beautiful sunset", "realistic");
    });

    expect(API.createGeneration).toHaveBeenCalledWith(mockToken, {
      prompt: "A beautiful sunset",
      style: "realistic",
    });
    expect(result.current.result).toEqual(mockGeneration);
    expect(result.current.generations).toContainEqual(mockGeneration);
    expect(result.current.error).toBe(null);
    expect(result.current.isGenerating).toBe(false);
  });

  it("should handle empty prompt error", async () => {
    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    await act(async () => {
      await result.current.handleGenerate("", "realistic");
    });

    expect(API.createGeneration).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Enter a prompt");
    expect(result.current.result).toBe(null);
  });

  it("should handle whitespace-only prompt", async () => {
    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    await act(async () => {
      await result.current.handleGenerate("   ", "realistic");
    });

    expect(API.createGeneration).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Enter a prompt");
  });

  it("should handle API error with response message", async () => {
    const apiError = {
      response: {
        data: {
          message: "Model overloaded",
        },
      },
    };

    (API.createGeneration as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    await act(async () => {
      await result.current.handleGenerate("Test prompt", "realistic");
    });

    expect(result.current.error).toBe("Model overloaded");
    expect(result.current.result).toBe(null);
    expect(result.current.isGenerating).toBe(false);
  });

  it("should handle generic Error", async () => {
    (API.createGeneration as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    await act(async () => {
      await result.current.handleGenerate("Test prompt", "realistic");
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.isGenerating).toBe(false);
  });

  it("should handle abort signal", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    (API.createGeneration as ReturnType<typeof vi.fn>).mockRejectedValue(abortError);

    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    await act(async () => {
      await result.current.handleGenerate("Test prompt", "realistic");
    });

    expect(result.current.error).toBe("Generation cancelled");
    expect(result.current.isGenerating).toBe(false);
  });

  it("should abort generation when handleAbort is called", async () => {
    // Mock a slow API call
    (API.createGeneration as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                id: 1,
                imageUrl: "https://example.com/image.jpg",
                prompt: "Test",
                style: "realistic",
                createdAt: new Date().toISOString(),
                status: "COMPLETED" as const,
              }),
            1000
          )
        )
    );

    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    // Start generation
    act(() => {
      void result.current.handleGenerate("Test prompt", "realistic");
    });

    // Wait for it to be generating
    await waitFor(() => expect(result.current.isGenerating).toBe(true));

    // Then abort
    act(() => {
      result.current.handleAbort();
    });

    // Should stop generating
    await waitFor(() => expect(result.current.isGenerating).toBe(false));
  });

  it("should limit generations to 5 items", async () => {
    const mockGenerations = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      imageUrl: `https://example.com/image${i + 1}.jpg`,
      prompt: `Test prompt ${i + 1}`,
      style: "realistic",
      createdAt: new Date().toISOString(),
      status: "COMPLETED" as const,
    }));

    (API.listGenerations as ReturnType<typeof vi.fn>).mockResolvedValue(mockGenerations);

    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    await act(async () => {
      await result.current.fetchGenerations();
    });

    expect(result.current.generations).toHaveLength(5);

    // Add a new generation
    const newGeneration = {
      id: 6,
      imageUrl: "https://example.com/image6.jpg",
      prompt: "New prompt",
      style: "cartoon",
      createdAt: new Date().toISOString(),
      status: "COMPLETED" as const,
    };

    (API.createGeneration as ReturnType<typeof vi.fn>).mockResolvedValue(newGeneration);

    await act(async () => {
      await result.current.handleGenerate("New prompt", "cartoon");
    });

    // Should still be limited to 5
    expect(result.current.generations).toHaveLength(5);
    // New one should be first
    expect(result.current.generations[0]).toEqual(newGeneration);
  });

  it("should update error state with setError", () => {
    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    act(() => {
      result.current.setError("Custom error");
    });

    expect(result.current.error).toBe("Custom error");

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBe(null);
  });

  it("should update result state with setResult", () => {
    const mockResult = {
      id: 1,
      imageUrl: "https://example.com/image.jpg",
      prompt: "Test",
      style: "realistic",
      createdAt: new Date().toISOString(),
      status: "COMPLETED" as const,
    };

    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    act(() => {
      result.current.setResult(mockResult);
    });

    expect(result.current.result).toEqual(mockResult);
  });

  it("should update generations with setGenerations", () => {
    const mockGenerations = [
      {
        id: 1,
        imageUrl: "https://example.com/image1.jpg",
        prompt: "Test 1",
        style: "realistic",
        createdAt: new Date().toISOString(),
        status: "COMPLETED" as const,
      },
    ];

    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    act(() => {
      result.current.setGenerations(mockGenerations);
    });

    expect(result.current.generations).toEqual(mockGenerations);

    // Test with function updater
    act(() => {
      result.current.setGenerations((prev) => [
        ...prev,
        {
          id: 2,
          imageUrl: "https://example.com/image2.jpg",
          prompt: "Test 2",
          style: "cartoon",
          createdAt: new Date().toISOString(),
          status: "COMPLETED" as const,
        },
      ]);
    });

    expect(result.current.generations).toHaveLength(2);
  });

  it("should silently handle fetchGenerations errors", async () => {
    (API.listGenerations as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Fetch error"));

    const { result } = renderHook(() => useGenerate({ token: mockToken }));

    await act(async () => {
      await result.current.fetchGenerations();
    });

    // Should not throw, generations should remain empty
    expect(result.current.generations).toEqual([]);
    expect(result.current.error).toBe(null);
  });
});
