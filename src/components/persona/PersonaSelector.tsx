"use client";

import type { Persona } from "@/lib/types";

interface PersonaSelectorProps {
  personas: Persona[];
  isLoading: boolean;
  onSelect: (persona: Persona) => void;
  onCreateNew: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PersonaSelector({
  personas,
  isLoading,
  onSelect,
  onCreateNew,
}: PersonaSelectorProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </div>
        <h3 className="font-heading text-lg font-semibold text-gray-900 mb-1">
          No brand personas yet
        </h3>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Upload documents about your brand to create your first brand
          persona.
        </p>
        <button
          type="button"
          onClick={onCreateNew}
          className="rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors"
        >
          Create your first brand persona
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {personas.map((persona) => {
        const docCount =
          (persona as Persona & { documents?: { count: number }[] })
            .documents?.[0]?.count ?? 0;
        const summary =
          (persona.persona_data?.summary as string) || "Not yet analyzed";

        return (
          <button
            key={persona.id}
            type="button"
            onClick={() => onSelect(persona)}
            className="group text-left rounded-xl border border-gray-200 bg-white p-5 hover:border-navy/30 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy font-heading font-bold text-lg">
                {persona.name[0]?.toUpperCase()}
              </div>
              {"summary" in (persona.persona_data ?? {}) && (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                  Analyzed
                </span>
              )}
            </div>
            <h3 className="font-heading font-semibold text-gray-900 group-hover:text-navy transition-colors">
              {persona.name}
            </h3>
            {persona.org_type && (
              <p className="text-xs text-gray-400 mt-0.5">{persona.org_type}</p>
            )}
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              {summary}
            </p>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
              <span>{docCount} doc{docCount !== 1 ? "s" : ""}</span>
              <span>Updated {formatDate(persona.updated_at)}</span>
            </div>
          </button>
        );
      })}

      {/* Create New card */}
      <button
        type="button"
        onClick={onCreateNew}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-5 hover:border-navy/40 hover:bg-gray-50 transition-all min-h-[160px]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 mb-3">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-500">
          Create new brand persona
        </span>
      </button>
    </div>
  );
}
