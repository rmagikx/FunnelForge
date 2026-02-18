"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePersonas } from "@/hooks/usePersonas";
import type { Persona } from "@/lib/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
}

export default function PersonasPage() {
  const router = useRouter();
  const {
    personas,
    isLoading,
    error: personaError,
    deletePersona,
  } = usePersonas();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, persona: Persona) {
    e.stopPropagation();
    e.preventDefault();
    const confirmed = window.confirm(
      `Delete "${persona.name}"? This will also remove all its documents and generated content.`
    );
    if (!confirmed) return;

    setDeletingId(persona.id);
    await deletePersona(persona.id);
    setDeletingId(null);
  }

  /* Loading skeleton */
  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-36 rounded skeleton mb-2" />
            <div className="h-4 w-56 rounded skeleton" />
          </div>
          <div className="h-10 w-32 rounded-lg skeleton" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            Brand Personas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your brand personas and their source documents.
          </p>
        </div>
        <Link
          href="/dashboard/personas/new"
          className="rounded-lg bg-coral px-4 py-3 text-sm font-semibold text-white hover:bg-coral-dark transition-colors"
        >
          Create New
        </Link>
      </div>

      {personaError && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {personaError}
        </div>
      )}

      {/* Empty state */}
      {personas.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
          <svg
            className="mx-auto h-12 w-12 text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
            />
          </svg>
          <h3 className="font-heading text-lg font-semibold text-gray-900 mb-1">
            No brand personas yet
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Upload documents about your brand to create your first brand persona
            and start generating content.
          </p>
          <Link
            href="/dashboard/personas/new"
            className="rounded-lg bg-coral px-5 py-3 text-sm font-semibold text-white hover:bg-coral-dark transition-colors"
          >
            Create your first brand persona
          </Link>
        </div>
      ) : (
        /* Persona grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((persona) => {
            const docCount =
              (persona as Persona & { documents?: { count: number }[] })
                .documents?.[0]?.count ?? 0;
            const pd = persona.persona_data as Record<string, unknown> | null;
            const isAnalyzed = pd !== null && "name" in (pd ?? {});
            const brandDescription = isAnalyzed
              ? String(pd?.name ?? "")
              : "";
            const isDeleting = deletingId === persona.id;

            return (
              <div
                key={persona.id}
                className={`group relative rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all duration-200 hover:border-coral/40 hover:shadow-lg ${
                  isDeleting ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Clickable card body → detail page */}
                <Link
                  href={`/dashboard/personas/${persona.id}`}
                  className="block p-5"
                >
                  {/* Top: logo/avatar + status */}
                  <div className="flex items-start justify-between mb-3">
                    {persona.logo_url ? (
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 overflow-hidden bg-white">
                        <Image src={persona.logo_url} alt={`${persona.name} logo`} width={44} height={44} className="h-full w-full object-contain p-1" unoptimized />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-navy-light text-white font-heading font-bold text-lg">
                        {persona.name[0]?.toUpperCase()}
                      </div>
                    )}
                    {isAnalyzed ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Analyzed
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                        Draft
                      </span>
                    )}
                  </div>

                  {/* Name + type */}
                  <h3 className="font-heading font-semibold text-gray-900 group-hover:text-coral transition-colors">
                    {persona.name}
                  </h3>
                  {brandDescription && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {brandDescription}
                    </p>
                  )}
                  {persona.org_type && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {persona.org_type}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      {docCount} doc{docCount !== 1 ? "s" : ""}
                    </span>
                    <span>Created {formatDate(persona.created_at)}</span>
                    <span className="ml-auto">
                      {formatRelative(persona.updated_at)}
                    </span>
                  </div>
                </Link>

                {/* Action bar */}
                <div className="flex items-center justify-end gap-1 px-4 pb-3 -mt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/dashboard/personas/${persona.id}`);
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, persona)}
                    className="rounded-lg p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete persona"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Create new card */}
          <Link
            href="/dashboard/personas/new"
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-5 hover:border-coral/40 hover:bg-coral/5 transition-all min-h-[220px]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 mb-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500">
              Create new brand persona
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
