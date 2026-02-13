"use client";

import { useState, useEffect, useCallback } from "react";
import type { Persona } from "@/lib/types";

interface UsePersonasReturn {
  personas: Persona[];
  selectedPersona: Persona | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  selectPersona: (persona: Persona | null) => void;
  createPersona: (
    name: string,
    orgType?: string
  ) => Promise<Persona | null>;
  updatePersona: (
    id: string,
    updates: { name?: string; orgType?: string }
  ) => Promise<Persona | null>;
  deletePersona: (id: string) => Promise<void>;
  reanalyzePersona: (id: string) => Promise<Persona | null>;
  refresh: () => Promise<void>;
}

export function usePersonas(): UsePersonasReturn {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/personas");
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to load personas");
      }

      const { personas: data } = (await res.json()) as {
        personas: Persona[];
      };
      setPersonas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load personas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const selectPersona = useCallback((persona: Persona | null) => {
    setSelectedPersona(persona);
  }, []);

  const createPersona = useCallback(
    async (
      name: string,
      orgType?: string
    ): Promise<Persona | null> => {
      setError(null);

      try {
        const res = await fetch("/api/personas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, orgType }),
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to create persona");
        }

        const { persona } = (await res.json()) as { persona: Persona };
        setPersonas((prev) => [persona, ...prev]);
        return persona;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create persona"
        );
        return null;
      }
    },
    []
  );

  const updatePersona = useCallback(
    async (
      id: string,
      updates: { name?: string; orgType?: string }
    ): Promise<Persona | null> => {
      setError(null);

      // Optimistic update
      const previous = personas;
      setPersonas((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name: updates.name ?? p.name,
                org_type: updates.orgType ?? p.org_type,
              }
            : p
        )
      );

      try {
        const res = await fetch(`/api/personas/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to update persona");
        }

        const { persona } = (await res.json()) as { persona: Persona };
        setPersonas((prev) => prev.map((p) => (p.id === id ? persona : p)));

        if (selectedPersona?.id === id) {
          setSelectedPersona(persona);
        }

        return persona;
      } catch (err) {
        setPersonas(previous);
        setError(
          err instanceof Error ? err.message : "Failed to update persona"
        );
        return null;
      }
    },
    [personas, selectedPersona]
  );

  const deletePersona = useCallback(
    async (id: string) => {
      setError(null);

      const previous = personas;
      setPersonas((prev) => prev.filter((p) => p.id !== id));

      if (selectedPersona?.id === id) {
        setSelectedPersona(null);
      }

      try {
        const res = await fetch(`/api/personas/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to delete persona");
        }
      } catch (err) {
        setPersonas(previous);
        setError(
          err instanceof Error ? err.message : "Failed to delete persona"
        );
      }
    },
    [personas, selectedPersona]
  );

  const reanalyzePersona = useCallback(
    async (id: string): Promise<Persona | null> => {
      setError(null);
      setIsAnalyzing(true);

      try {
        const res = await fetch("/api/analyze-persona", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId: id }),
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to analyze persona");
        }

        const { persona } = (await res.json()) as { persona: Persona };
        setPersonas((prev) => prev.map((p) => (p.id === id ? persona : p)));

        if (selectedPersona?.id === id) {
          setSelectedPersona(persona);
        }

        return persona;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to analyze persona"
        );
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [selectedPersona]
  );

  return {
    personas,
    selectedPersona,
    isLoading,
    isAnalyzing,
    error,
    selectPersona,
    createPersona,
    updatePersona,
    deletePersona,
    reanalyzePersona,
    refresh: fetchPersonas,
  };
}
