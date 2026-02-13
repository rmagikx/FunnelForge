"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePersonas } from "@/hooks/usePersonas";
import { useContentGeneration } from "@/hooks/useContentGeneration";
import { CHANNEL_SPECS } from "@/lib/prompts/channel-specs";
import type { ContentPiece, ChannelContent } from "@/lib/types";

const ALL_CHANNELS = Object.keys(CHANNEL_SPECS);
const FUNNEL_STAGES = ["awareness", "consideration", "conversion"] as const;
const STAGE_COLORS = {
  awareness: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  consideration: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  conversion: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
} as const;

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const personaIdParam = searchParams.get("persona");

  const { personas, isLoading: personasLoading } = usePersonas();
  const { generatedContent, isGenerating, error, generate, reset } =
    useContentGeneration();

  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
    personaIdParam
  );
  const [problem, setProblem] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([...ALL_CHANNELS]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Set persona from URL param
  useEffect(() => {
    if (personaIdParam) setSelectedPersonaId(personaIdParam);
  }, [personaIdParam]);

  // Set first channel tab when results arrive
  useEffect(() => {
    if (generatedContent) {
      const firstChannel = Object.keys(generatedContent)[0];
      if (firstChannel) setActiveTab(firstChannel);
    }
  }, [generatedContent]);

  const selectedPersona = useMemo(
    () => personas.find((p) => p.id === selectedPersonaId) ?? null,
    [personas, selectedPersonaId]
  );

  const isAnalyzed = useMemo(
    () =>
      selectedPersona
        ? "name" in ((selectedPersona.persona_data as Record<string, unknown>) ?? {})
        : false,
    [selectedPersona]
  );

  function toggleChannel(ch: string) {
    setSelectedChannels((prev) =>
      prev.includes(ch)
        ? prev.filter((c) => c !== ch)
        : [...prev, ch]
    );
  }

  async function handleGenerate() {
    if (!selectedPersonaId || !problem.trim() || selectedChannels.length === 0)
      return;
    reset();
    await generate(selectedPersonaId, problem.trim(), selectedChannels);
  }

  // ── Keyboard shortcut: Cmd+Enter / Ctrl+Enter to generate ──
  const handleGenerateRef = useRef(handleGenerate);
  handleGenerateRef.current = handleGenerate;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerateRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const copyToClipboard = useCallback(
    (text: string, key: string) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      });
    },
    []
  );

  function exportAll() {
    if (!generatedContent) return;
    const blob = new Blob(
      [JSON.stringify(generatedContent, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `funnel-content-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Loading
  if (personasLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 rounded-2xl skeleton" />
        <div className="h-40 rounded-2xl skeleton" />
        <div className="h-12 rounded-2xl skeleton" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Persona bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {selectedPersona ? (
            <>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-navy-light text-white font-heading font-bold">
                  {selectedPersona.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-gray-900 truncate">
                    {selectedPersona.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isAnalyzed ? "Analyzed" : "Draft"}{" "}
                    {selectedPersona.org_type && `\u00b7 ${selectedPersona.org_type}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/personas"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Switch persona
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Upload more docs
                </Link>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 flex-1">
              <p className="text-sm text-gray-500">No persona selected.</p>
              {personas.length > 0 && (
                <select
                  value=""
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                >
                  <option value="" disabled>
                    Choose a persona...
                  </option>
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              <Link
                href="/dashboard"
                className="text-xs font-medium text-coral hover:underline"
              >
                Create one
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Problem statement */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6">
        <label
          htmlFor="problem"
          className="block font-heading text-sm font-semibold text-gray-900 mb-2"
        >
          What marketing problem are you solving?
        </label>
        <textarea
          id="problem"
          rows={4}
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="e.g. We need to launch a new product line targeting enterprise buyers. Our current messaging doesn't resonate with CTOs and IT directors who are our primary decision makers..."
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm leading-relaxed focus:border-coral focus:ring-1 focus:ring-coral outline-none resize-none"
        />
      </div>

      {/* Channel selection */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-sm font-semibold text-gray-900">
            Channels
          </h3>
          <button
            type="button"
            onClick={() =>
              setSelectedChannels((prev) =>
                prev.length === ALL_CHANNELS.length ? [] : [...ALL_CHANNELS]
              )
            }
            className="text-xs font-medium text-coral hover:underline"
          >
            {selectedChannels.length === ALL_CHANNELS.length
              ? "Deselect all"
              : "Select all"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_CHANNELS.map((ch) => {
            const spec = CHANNEL_SPECS[ch];
            const isSelected = selectedChannels.includes(ch);
            return (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                  isSelected
                    ? "bg-navy text-white border-navy"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                {spec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={
          isGenerating ||
          !selectedPersonaId ||
          !problem.trim() ||
          selectedChannels.length === 0 ||
          !isAnalyzed
        }
        className="w-full rounded-xl bg-coral px-6 py-3.5 text-sm font-bold text-white hover:bg-coral-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating content...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Generate Content
            <kbd className="hidden sm:inline-flex items-center rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-[10px] font-mono">
              &#8984;&#9166;
            </kbd>
          </span>
        )}
      </button>

      {!isAnalyzed && selectedPersonaId && (
        <p className="text-xs text-amber-600 -mt-4 mb-6">
          This persona hasn&apos;t been analyzed yet. Please{" "}
          <Link href="/dashboard/personas" className="underline">
            analyze it first
          </Link>
          .
        </p>
      )}

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Generating skeleton */}
      {isGenerating && (
        <div className="space-y-4">
          <div className="h-12 rounded-xl skeleton" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl skeleton" />
          ))}
        </div>
      )}

      {/* Results */}
      {generatedContent && !isGenerating && (
        <div className="animate-fade-in">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-gray-900">
              Generated Content
            </h2>
            <button
              type="button"
              onClick={exportAll}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export All
            </button>
          </div>

          {/* Channel tabs */}
          <div className="flex overflow-x-auto gap-1 mb-6 pb-1">
            {Object.keys(generatedContent).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setActiveTab(ch)}
                className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                  activeTab === ch
                    ? "bg-navy text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {CHANNEL_SPECS[ch]?.label ?? ch}
              </button>
            ))}
          </div>

          {/* Funnel stage cards */}
          {activeTab && generatedContent[activeTab] && (
            <div className="space-y-6">
              {FUNNEL_STAGES.map((stage) => {
                const pieces = (generatedContent[activeTab] as ChannelContent)[stage];
                if (!pieces || pieces.length === 0) return null;
                const colors = STAGE_COLORS[stage];

                return (
                  <div key={stage}>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center rounded-full ${colors.bg} ${colors.text} px-3 py-1 text-xs font-bold uppercase tracking-wide`}
                      >
                        {stage}
                      </span>
                      <span className="text-xs text-gray-400">
                        {pieces.length} piece{pieces.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {pieces.map((piece: ContentPiece, i: number) => {
                        const key = `${activeTab}-${stage}-${i}`;
                        const fullText = `${piece.headline}\n\n${piece.body}\n\nCTA: ${piece.cta}${
                          piece.hashtags.length > 0
                            ? `\n\n${piece.hashtags.map((h) => `#${h}`).join(" ")}`
                            : ""
                        }`;

                        return (
                          <div
                            key={key}
                            className={`rounded-xl border ${colors.border} bg-white p-4 flex flex-col`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-heading text-sm font-bold text-gray-900 leading-tight">
                                {piece.headline}
                              </h4>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(fullText, key)}
                                className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                title="Copy"
                              >
                                {copiedKey === key ? (
                                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                  </svg>
                                )}
                              </button>
                            </div>

                            <p className="text-xs text-gray-600 leading-relaxed flex-1 whitespace-pre-wrap line-clamp-6">
                              {piece.body}
                            </p>

                            {piece.cta && (
                              <div className="mt-3 pt-2 border-t border-gray-100">
                                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">
                                  CTA
                                </span>
                                <p className="text-xs font-semibold text-coral mt-0.5">
                                  {piece.cta}
                                </p>
                              </div>
                            )}

                            <div className="mt-2 flex flex-wrap gap-1">
                              {piece.hashtags.slice(0, 5).map((tag: string) => (
                                <span
                                  key={tag}
                                  className="text-[10px] text-gray-400"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>

                            <div className="mt-2 flex items-center gap-1.5">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                                {piece.format}
                              </span>
                            </div>

                            {piece.posting_tip && (
                              <p className="mt-2 text-[10px] italic text-gray-400">
                                Tip: {piece.posting_tip}
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
          )}

          <p className="text-xs text-gray-400 text-center mt-6">
            Content was auto-saved to your generation history.
          </p>
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-16 rounded-2xl skeleton" />
          <div className="h-40 rounded-2xl skeleton" />
          <div className="h-12 rounded-2xl skeleton" />
        </div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
