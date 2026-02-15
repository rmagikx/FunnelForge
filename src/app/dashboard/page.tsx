"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePersonas } from "@/hooks/usePersonas";
import { useToast } from "@/components/ui/Toast";
import OnboardingFlow from "@/components/dashboard/OnboardingFlow";
import type { Persona } from "@/lib/types";

function formatRelativeDate(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { personas, isLoading, deletePersona } = usePersonas();
  const { addToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleSelectPersona(persona: Persona) {
    router.push(`/dashboard/generate?persona=${persona.id}`);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePersona(deleteTarget.id);
      addToast("success", `"${deleteTarget.name}" has been deleted`);
      setDeleteTarget(null);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to delete persona");
    } finally {
      setIsDeleting(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-8 w-48 rounded skeleton mb-2" />
          <div className="h-4 w-72 rounded skeleton" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  // MODE B — New user, no personas
  if (personas.length === 0) {
    return (
      <div>
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome to FunnelForge
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Build a brand persona from your documents, then generate full-funnel marketing content in seconds.
          </p>
        </div>
        <OnboardingFlow />
      </div>
    );
  }

  // MODE A — Returning user with personas
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-gray-900">
          Your Personas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a persona to start generating content, or create a new one.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => {
          const docCount =
            (persona as Persona & { documents?: { count: number }[] })
              .documents?.[0]?.count ?? 0;
          const isAnalyzed = "name" in ((persona.persona_data as Record<string, unknown>) ?? {});
          const brandName =
            isAnalyzed
              ? String((persona.persona_data as Record<string, unknown>).name ?? persona.name)
              : persona.name;

          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => handleSelectPersona(persona)}
              className="group text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-coral/40 hover:shadow-lg transition-all duration-200"
            >
              {/* Avatar + badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-navy-light text-white font-heading font-bold text-lg">
                  {persona.name[0]?.toUpperCase()}
                </div>
                {isAnalyzed ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                    Analyzed
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                    Draft
                  </span>
                )}
              </div>

              {/* Name */}
              <h3 className="font-heading font-semibold text-gray-900 group-hover:text-coral transition-colors">
                {brandName}
              </h3>
              {persona.org_type && (
                <p className="text-xs text-gray-400 mt-0.5">{persona.org_type}</p>
              )}

              {/* Meta + delete */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  {docCount} doc{docCount !== 1 ? "s" : ""}
                </span>
                <span className="flex-1">Last used: {formatRelativeDate(persona.updated_at)}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ id: persona.id, name: persona.name });
                  }}
                  className="rounded p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Delete persona"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </button>
          );
        })}

        {/* Create new card */}
        <button
          type="button"
          onClick={() => router.push("/dashboard/personas")}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-5 hover:border-coral/40 hover:bg-coral/5 transition-all min-h-[180px]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 mb-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-500">
            Create new persona
          </span>
        </button>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 mb-4">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">
              Delete &ldquo;{deleteTarget.name}&rdquo;?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently remove the persona along with all its documents and generated content. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
