"use client";

import { useState, useCallback } from "react";
import type { GenerationRow, GeneratedPlan } from "@/lib/types";

/** Safely parse a fetch response as JSON, returning a typed object. */
async function parseResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      text.includes("FUNCTION_INVOCATION_TIMEOUT") || text.includes("504")
        ? "The request timed out — please try again"
        : "Server returned an unexpected response — please try again"
    );
  }
}

interface UseContentGenerationReturn {
  /** The full generation row (includes DB id, timestamps, etc.) */
  generation: GenerationRow | null;
  /** Typed generated content extracted from the generation */
  generatedContent: GeneratedPlan | null;
  /** True while the API call is in progress */
  isGenerating: boolean;
  /** Error message, if any */
  error: string | null;
  /** Trigger content generation */
  generate: (
    personaId: string,
    problemStatement: string,
    channels: string[]
  ) => Promise<GenerationRow | null>;
  /** Reset state */
  reset: () => void;
}

export function useContentGeneration(): UseContentGenerationReturn {
  const [generation, setGeneration] = useState<GenerationRow | null>(null);
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (
      personaId: string,
      problemStatement: string,
      channels: string[]
    ): Promise<GenerationRow | null> => {
      setError(null);
      setIsGenerating(true);

      try {
        const res = await fetch("/api/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId, problemStatement, channels }),
        });
        const body = await parseResponse(res);
        if (!res.ok) {
          throw new Error((body.error as string) || "Failed to generate content");
        }
        const gen = body.generation as GenerationRow;

        setGeneration(gen);
        setGeneratedContent(
          gen.generated_content as unknown as GeneratedPlan
        );

        return gen;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate content"
        );
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setGeneration(null);
    setGeneratedContent(null);
    setError(null);
  }, []);

  return {
    generation,
    generatedContent,
    isGenerating,
    error,
    generate,
    reset,
  };
}
