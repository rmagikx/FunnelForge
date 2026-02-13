"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/lib/types";

interface UseDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  uploadFiles: (files: File[]) => Promise<Document[]>;
  deleteDocument: (documentId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDocuments(personaId: string | null): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!personaId) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("documents")
        .select("*")
        .eq("persona_id", personaId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setDocuments((data ?? []) as Document[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [personaId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadFiles = useCallback(
    async (files: File[]): Promise<Document[]> => {
      if (!personaId) {
        setError("No persona selected");
        return [];
      }

      setIsUploading(true);
      setError(null);

      // Optimistic: add placeholder entries
      const placeholders: Document[] = files.map((file, i) => ({
        id: `uploading-${i}-${Date.now()}`,
        persona_id: personaId,
        user_id: "",
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: "",
        extracted_text: null,
        created_at: new Date().toISOString(),
      }));

      setDocuments((prev) => [...placeholders, ...prev]);

      try {
        const formData = new FormData();
        formData.set("personaId", personaId);
        files.forEach((file) => formData.append("files", file));

        const res = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Upload failed");
        }

        const { documents: uploaded } = (await res.json()) as {
          documents: Document[];
        };

        // Replace placeholders with real records
        setDocuments((prev) => [
          ...uploaded,
          ...prev.filter((d) => !d.id.startsWith("uploading-")),
        ]);

        return uploaded;
      } catch (err) {
        // Roll back optimistic updates
        setDocuments((prev) =>
          prev.filter((d) => !d.id.startsWith("uploading-"))
        );
        const message =
          err instanceof Error ? err.message : "Upload failed";
        setError(message);
        return [];
      } finally {
        setIsUploading(false);
      }
    },
    [personaId]
  );

  const removeDocument = useCallback(
    async (documentId: string) => {
      setError(null);

      // Optimistic: remove immediately
      const previous = documents;
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));

      try {
        const res = await fetch("/api/documents", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Delete failed");
        }
      } catch (err) {
        // Roll back on failure
        setDocuments(previous);
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    },
    [documents]
  );

  return {
    documents,
    isLoading,
    isUploading,
    error,
    uploadFiles,
    deleteDocument: removeDocument,
    refresh: fetchDocuments,
  };
}
