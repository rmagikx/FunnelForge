"use client";

import { useState } from "react";
import { usePersonas } from "@/hooks/usePersonas";
import { useDocuments } from "@/hooks/useDocuments";
import type { Persona } from "@/lib/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PersonaList() {
  const {
    personas,
    isLoading,
    isAnalyzing,
    error: personaError,
    createPersona,
    updatePersona,
    deletePersona,
    reanalyzePersona,
  } = usePersonas();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOrgType, setNewOrgType] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    const persona = await createPersona(newName, newOrgType || undefined);
    if (persona) {
      setShowCreate(false);
      setNewName("");
      setNewOrgType("");
      setExpandedId(persona.id);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    await updatePersona(id, { name: editName });
    setEditingId(null);
  }

  async function handleDelete(persona: Persona) {
    const confirmed = window.confirm(
      `Delete "${persona.name}"? This will also remove all its documents and generated content.`
    );
    if (confirmed) {
      if (expandedId === persona.id) setExpandedId(null);
      await deletePersona(persona.id);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            Brand Personas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your brand personas and their source documents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light transition-colors"
        >
          New brand persona
        </button>
      </div>

      {personaError && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {personaError}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-5"
        >
          <h3 className="font-heading font-semibold text-gray-900 mb-4">
            Create new brand persona
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="persona-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Persona name *
              </label>
              <input
                id="persona-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Enterprise SaaS Buyer"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="org-type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Organization type
              </label>
              <input
                id="org-type"
                type="text"
                value={newOrgType}
                onChange={(e) => setNewOrgType(e.target.value)}
                placeholder="e.g. B2B SaaS, E-commerce"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setNewName("");
                setNewOrgType("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Persona list */}
      {personas.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">
            No brand personas yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden"
            >
              {/* Persona row */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy font-heading font-bold text-lg">
                  {persona.name[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === persona.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(persona.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(persona.id)}
                        className="text-xs text-navy font-medium"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {persona.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {persona.org_type && (
                          <span>{persona.org_type}</span>
                        )}
                        <span>Updated {formatDate(persona.updated_at)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {"summary" in (persona.persona_data ?? {}) ? (
                    <span className="mr-2 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      Analyzed
                    </span>
                  ) : (
                    <span className="mr-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      Draft
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(
                        expandedId === persona.id ? null : persona.id
                      )
                    }
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="View documents"
                  >
                    <svg
                      className={`h-4 w-4 transition-transform ${
                        expandedId === persona.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(persona.id);
                      setEditName(persona.name);
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="Edit name"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => reanalyzePersona(persona.id)}
                    disabled={isAnalyzing}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
                    title="Re-analyze persona"
                  >
                    <svg
                      className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(persona)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete persona"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded: documents panel */}
              {expandedId === persona.id && (
                <PersonaDocuments personaId={persona.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Inline sub-component showing documents for a persona */
function PersonaDocuments({ personaId }: { personaId: string }) {
  const {
    documents,
    isLoading,
    error,
    deleteDocument,
  } = useDocuments(personaId);

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        Documents
      </h4>
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-400">
          No documents uploaded yet. Upload files via the generate flow to
          build this persona.
        </p>
      ) : (
        <ul className="space-y-1">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="h-4 w-4 shrink-0 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
                <span className="text-sm text-gray-700 truncate">
                  {doc.file_name}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatBytes(doc.file_size)}
                </span>
                {doc.extracted_text && (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                    Parsed
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => deleteDocument(doc.id)}
                className="shrink-0 rounded p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete document"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
