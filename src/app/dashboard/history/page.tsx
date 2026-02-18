"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CHANNEL_SPECS } from "@/lib/prompts/channel-specs";
import type { GenerationRow, ContentPiece, ChannelContent } from "@/lib/types";

interface GenerationWithPersona extends GenerationRow {
  personas?: { name: string } | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const FUNNEL_STAGES = ["awareness", "consideration", "conversion"] as const;
const STAGE_COLORS = {
  awareness: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  consideration: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  conversion: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
} as const;

export default function HistoryPage() {
  const [generations, setGenerations] = useState<GenerationWithPersona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchGenerations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("generations")
        .select("*, personas(name)")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setGenerations((data ?? []) as GenerationWithPersona[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this generation? This cannot be undone."
    );
    if (!confirmed) return;

    const previous = generations;
    setGenerations((prev) => prev.filter((g) => g.id !== id));
    if (expandedId === id) setExpandedId(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("generations")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
    } catch {
      setGenerations(previous);
      setError("Failed to delete generation");
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
    // Set default active tab for this generation
    if (expandedId !== id) {
      const gen = generations.find((g) => g.id === id);
      if (gen) {
        const channels = gen.channels;
        if (channels.length > 0 && !activeTab[id]) {
          setActiveTab((prev) => ({ ...prev, [id]: channels[0] }));
        }
      }
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }

  // Loading
  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-8 w-40 rounded skeleton mb-2" />
          <div className="h-4 w-64 rounded skeleton" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-gray-900">
          Generation History
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage your past content generations.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {generations.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200 bg-white">
          <svg
            className="mx-auto h-10 w-10 text-gray-300 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            No generations yet. Go to the{" "}
            <a href="/dashboard/generate" className="text-coral font-medium hover:underline">
              Generate
            </a>{" "}
            page to create content.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {generations.map((gen) => {
            const isExpanded = expandedId === gen.id;
            const personaName =
              gen.personas?.name ?? "Unknown persona";
            const content = gen.generated_content as unknown as Record<string, ChannelContent> | null;

            return (
              <div
                key={gen.id}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
              >
                {/* Summary row */}
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={() => toggleExpand(gen.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy font-heading font-bold text-sm">
                        {personaName[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-semibold text-sm text-gray-900">
                            {personaName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(gen.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">
                          {gen.problem_statement}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {gen.channels.map((ch) => (
                            <span
                              key={ch}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
                            >
                              {CHANNEL_SPECS[ch]?.label ?? ch}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(gen.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      <svg
                        className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(gen.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && content && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-5 animate-fade-in">
                    {/* Full problem */}
                    <div className="mb-4 rounded-lg bg-white border border-gray-200 p-3">
                      <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">
                        Problem Statement
                      </span>
                      <p className="text-sm text-gray-700 mt-1">
                        {gen.problem_statement}
                      </p>
                    </div>

                    {/* Channel tabs */}
                    <div className="flex overflow-x-auto gap-1 mb-4 pb-1">
                      {gen.channels.map((ch) => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() =>
                            setActiveTab((prev) => ({ ...prev, [gen.id]: ch }))
                          }
                          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                            (activeTab[gen.id] ?? gen.channels[0]) === ch
                              ? "bg-navy text-white"
                              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                          }`}
                        >
                          {CHANNEL_SPECS[ch]?.label ?? ch}
                        </button>
                      ))}
                    </div>

                    {/* Stage cards */}
                    {(() => {
                      const currentCh = activeTab[gen.id] ?? gen.channels[0];
                      const channelData = content[currentCh];
                      if (!channelData) return null;

                      return (
                        <div className="space-y-4">
                          {FUNNEL_STAGES.map((stage) => {
                            const pieces = (channelData as ChannelContent)[stage];
                            if (!pieces || pieces.length === 0) return null;
                            const colors = STAGE_COLORS[stage];

                            return (
                              <div key={stage}>
                                <span
                                  className={`inline-flex items-center rounded-full ${colors.bg} ${colors.text} px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide mb-2`}
                                >
                                  {stage}
                                </span>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                  {pieces.map((piece: ContentPiece, i: number) => {
                                    const key = `${gen.id}-${currentCh}-${stage}-${i}`;
                                    const fullText = `${piece.headline}\n\n${piece.body}\n\nCTA: ${piece.cta}`;

                                    return (
                                      <div
                                        key={key}
                                        className={`rounded-xl border ${colors.border} bg-white p-3`}
                                      >
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                          <h4 className="font-heading text-xs font-bold text-gray-900 leading-tight">
                                            {piece.headline}
                                          </h4>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              copyToClipboard(fullText, key)
                                            }
                                            className="shrink-0 rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                            title="Copy"
                                          >
                                            {copiedKey === key ? (
                                              <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                              </svg>
                                            ) : (
                                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                              </svg>
                                            )}
                                          </button>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                                          {piece.body}
                                        </p>
                                        {piece.cta && (
                                          <p className="mt-2 text-xs font-semibold text-coral">
                                            {piece.cta}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
