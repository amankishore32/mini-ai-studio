import { useState, useRef, useCallback } from "react";
import { useRetry } from "./useRetry";
import API from "../services/api";
import type { Generation } from "../types";

interface UseGenerateOptions {
  token: string;
}

interface UseGenerateReturn {
  isGenerating: boolean;
  error: string | null;
  result: Generation | null;
  generations: Generation[];
  handleGenerate: (prompt: string, style: string) => Promise<void>;
  handleAbort: () => void;
  setError: (error: string | null) => void;
  setResult: (result: Generation | null) => void;
  setGenerations: (gens: Generation[] | ((prev: Generation[]) => Generation[])) => void;
  fetchGenerations: () => Promise<void>;
}

export const useGenerate = ({ token }: UseGenerateOptions): UseGenerateReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Generation | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { error: retryError, execute } = useRetry({
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 5000,
  });

  const fetchGenerations = useCallback(async () => {
    try {
      const gens = await API.listGenerations(token, 5);
      setGenerations(gens);
    } catch {
      // Silently handle fetch errors for now
    }
  }, [token]);

  const handleGenerate = useCallback(
    async (prompt: string, style: string) => {
      if (!prompt.trim()) {
        setError("Enter a prompt");
        return;
      }
      setIsGenerating(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      try {
        const gen = await execute(
          async () => API.createGeneration(token, { prompt, style }),
          abortControllerRef.current?.signal
        );
        setResult(gen);
        setGenerations((prev) => [gen, ...prev].slice(0, 5));
        setError(null);
      } catch (err) {
        // Don't show error if aborted
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Generation cancelled");
        } else if (err && typeof err === "object" && "response" in err) {
          // @ts-expect-error runtime guard
          setError(err.response?.data?.message || "Generation failed");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(retryError || "Generation failed");
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [token, execute, retryError]
  );

  const handleAbort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    error,
    result,
    generations,
    handleGenerate,
    handleAbort,
    setError,
    setResult,
    setGenerations,
    fetchGenerations,
  };
};
