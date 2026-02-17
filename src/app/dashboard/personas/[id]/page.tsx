"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDocuments } from "@/hooks/useDocuments";
import type { Persona, BrandPersona } from "@/lib/types";

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

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function PersonaDetailPage() {
  const { id } = useParams<{ id: string }>();

  /* ── Persona state ── */
  const [persona, setPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ── Inline edit ── */
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<BrandPersona | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrgType, setEditOrgType] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  /* ── Re-analyze ── */
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /* ── Documents ── */
  const { documents, isLoading: docsLoading, isUploading, error: docsError, uploadFiles, deleteDocument } =
    useDocuments(id);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Fetch persona ── */
  const fetchPersona = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/personas/${id}`);
      const text = await res.text();
      let body: Record<string, unknown>;
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error("Server returned an unexpected response — please try again");
      }
      if (!res.ok) {
        throw new Error((body.error as string) || "Not found");
      }
      setPersona(body.persona as Persona);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load persona");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPersona();
  }, [fetchPersona]);

  /* ── Derived ── */
  const pd = persona?.persona_data as Record<string, unknown> | null;
  const isAnalyzed = pd !== null && pd !== undefined && "name" in (pd ?? {});
  const brandPersona = isAnalyzed ? (pd as unknown as BrandPersona) : null;

  /* ── Start editing ── */
  function startEditing() {
    if (!persona) return;
    setEditName(persona.name);
    setEditOrgType(persona.org_type ?? "");
    setEditData(brandPersona ? { ...brandPersona } : null);
    setIsEditing(true);
  }

  /* ── Save edits ── */
  async function handleSave() {
    if (!persona) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const body: Record<string, unknown> = {};
      if (editName !== persona.name) body.name = editName;
      if (editOrgType !== (persona.org_type ?? "")) body.orgType = editOrgType;
      if (editData) body.personaData = editData;

      if (Object.keys(body).length === 0) {
        setIsEditing(false);
        return;
      }

      const res = await fetch(`/api/personas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let resBody: Record<string, unknown>;
      try {
        resBody = JSON.parse(text);
      } catch {
        throw new Error("Server returned an unexpected response — please try again");
      }
      if (!res.ok) {
        throw new Error((resBody.error as string) || "Save failed");
      }
      setPersona(resBody.persona as Persona);
      setIsEditing(false);
      showSuccess("Persona updated!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  /* ── Re-analyze ── */
  async function handleReanalyze() {
    // Check if there are any parsed documents before calling the API
    const parsedDocs = documents.filter((d) => d.extracted_text);
    if (parsedDocs.length === 0) {
      setError(
        documents.length === 0
          ? "Please upload documents before running analysis."
          : "None of the uploaded documents could be parsed. Please upload PDF, DOCX, or TXT files."
      );
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/analyze-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: id }),
      });
      const text = await res.text();
      let body: Record<string, unknown>;
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error("Server returned an unexpected response — please try again");
      }
      if (!res.ok) {
        throw new Error((body.error as string) || "Analysis failed");
      }
      setPersona(body.persona as Persona);
      showSuccess("Persona re-analyzed successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }

  /* ── Upload handler ── */
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    await uploadFiles(selected);
    setShowUpload(false);
    showSuccess(`${selected.length} file${selected.length > 1 ? "s" : ""} uploaded!`);
    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  /* ── Edit field helpers ── */
  function updateField(field: keyof BrandPersona, value: string | string[]) {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  }

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto">
        <div className="h-5 w-32 rounded skeleton mb-6" />
        <div className="h-64 rounded-2xl skeleton mb-6" />
        <div className="h-40 rounded-2xl skeleton" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">{error ?? "Persona not found"}</p>
        <Link href="/dashboard/personas" className="text-coral text-sm font-medium mt-2 inline-block hover:underline">
          Back to personas
        </Link>
      </div>
    );
  }

  /* ━━━━━━━━━━━━━━━━━━ RENDER ━━━━━━━━━━━━━━━━━━ */
  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/personas"
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 mb-6"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Personas
      </Link>

      {/* Banners */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 animate-fade-in">
          {successMsg}
        </div>
      )}

      {/* ── Persona header card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-navy-light text-white font-heading font-bold text-2xl">
            {persona.name[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                />
                <input
                  type="text"
                  value={editOrgType}
                  onChange={(e) => setEditOrgType(e.target.value)}
                  placeholder="Organization type"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                />
              </div>
            ) : (
              <>
                <h1 className="font-heading text-2xl font-bold text-gray-900">
                  {persona.name}
                </h1>
                {persona.org_type && (
                  <p className="text-sm text-gray-500 mt-0.5">{persona.org_type}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>Created {formatDate(persona.created_at)}</span>
                  <span>Updated {formatDate(persona.updated_at)}</span>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-lg bg-coral px-4 py-1.5 text-xs font-semibold text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Spinner className="h-3.5 w-3.5" /> : "Save"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startEditing}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleReanalyze}
                  disabled={isAnalyzing}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-1.5">
                      <Spinner className="h-3.5 w-3.5" /> Updating...
                    </span>
                  ) : (
                    "Update Brand Persona"
                  )}
                </button>
                <Link
                  href={`/dashboard/generate?persona=${id}`}
                  className="rounded-lg bg-coral px-4 py-1.5 text-xs font-semibold text-white hover:bg-coral-dark transition-colors"
                >
                  Use This Persona
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Persona fields ── */}
      {isEditing && editData ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6 space-y-5">
          <h2 className="font-heading text-sm font-semibold text-gray-900">Persona Fields</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditInput label="Persona Name" value={editData.name} onChange={(v) => updateField("name", v)} />
            <EditInput label="Type" value={editData.type} onChange={(v) => updateField("type", v)} />
          </div>
          <EditTextarea label="Mission" value={editData.mission} onChange={(v) => updateField("mission", v)} />
          <EditTags label="Tone" values={editData.tone} onChange={(v) => updateField("tone", v)} />
          <EditTags label="Audience" values={editData.audience} onChange={(v) => updateField("audience", v)} />
          <EditTags label="Values" values={editData.values} onChange={(v) => updateField("values", v)} />
          <EditTags label="Vocabulary" values={editData.vocabulary} onChange={(v) => updateField("vocabulary", v)} />
          <EditTags label="Differentiators" values={editData.differentiators} onChange={(v) => updateField("differentiators", v)} />
          <EditTags label="Content Patterns" values={editData.contentPatterns} onChange={(v) => updateField("contentPatterns", v)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voice Samples</label>
            <div className="space-y-2">
              {editData.voiceSamples.map((s, i) => (
                <textarea
                  key={i}
                  value={s}
                  onChange={(e) => {
                    const u = [...editData.voiceSamples];
                    u[i] = e.target.value;
                    updateField("voiceSamples", u);
                  }}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                />
              ))}
            </div>
          </div>
        </div>
      ) : brandPersona ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
          <h2 className="font-heading text-sm font-semibold text-gray-900 mb-4">
            Brand Persona
          </h2>

          {/* Name + type + mission */}
          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Mission</span>
            <p className="text-sm text-gray-700 mt-1">{brandPersona.mission}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <ReadonlyTags label="Tone" values={brandPersona.tone} />
            <ReadonlyTags label="Audience" values={brandPersona.audience} />
            <ReadonlyTags label="Values" values={brandPersona.values} />
            <ReadonlyTags label="Vocabulary" values={brandPersona.vocabulary} />
            <ReadonlyTags label="Differentiators" values={brandPersona.differentiators} />
            <ReadonlyTags label="Content Patterns" values={brandPersona.contentPatterns} />
          </div>

          {brandPersona.voiceSamples.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Voice Samples</span>
              <div className="mt-2 space-y-2">
                {brandPersona.voiceSamples.map((s, i) => (
                  <p key={i} className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">
                    &ldquo;{s}&rdquo;
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center mb-6">
          <p className="text-sm text-gray-500 mb-3">
            This persona hasn&apos;t been analyzed yet.
          </p>
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={isAnalyzing || documents.length === 0}
            className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2"><Spinner /> Analyzing...</span>
            ) : (
              "Analyze Now"
            )}
          </button>
          {documents.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Upload documents first to run analysis.
            </p>
          )}
        </div>
      )}

      {/* ── Documents section ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-sm font-semibold text-gray-900">
            Documents ({documents.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showUpload ? "Cancel" : "Add More Documents"}
          </button>
        </div>

        {docsError && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {docsError}
          </div>
        )}

        {/* Upload zone */}
        {showUpload && (
          <div className="mb-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const dropped = Array.from(e.dataTransfer.files);
                if (dropped.length > 0) {
                  await uploadFiles(dropped);
                  setShowUpload(false);
                  showSuccess(`${dropped.length} file${dropped.length > 1 ? "s" : ""} uploaded!`);
                }
              }}
              className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:border-coral/50 hover:bg-coral/5 transition-colors"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Spinner /> Uploading...
                </div>
              ) : (
                <>
                  <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-xs font-medium text-gray-600">
                    Drop files or click to browse
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.csv"
                onChange={handleUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Document list */}
        {docsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 rounded-lg skeleton" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No documents uploaded yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <span className="text-sm text-gray-700 truncate">{doc.file_name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatBytes(doc.file_size)}</span>
                  {doc.extracted_text && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                      Parsed
                    </span>
                  )}
                  {doc.id.startsWith("uploading-") && (
                    <Spinner className="h-3 w-3 text-gray-400" />
                  )}
                </div>
                {!doc.id.startsWith("uploading-") && (
                  <button
                    type="button"
                    onClick={() => deleteDocument(doc.id)}
                    className="shrink-0 rounded p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    title="Remove"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom Update Brand Persona button */}
      {!isEditing && documents.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={isAnalyzing}
            className="w-full rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Updating Brand Persona...
              </span>
            ) : (
              "Update Brand Persona"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━ Helper sub-components ━━━━━━━━━━━━━━ */

function ReadonlyTags({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">
        {label}
      </span>
      <div className="flex flex-wrap gap-1 mt-1">
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-medium text-navy"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function EditInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none"
      />
    </div>
  );
}

function EditTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none"
      />
    </div>
  );
}

function EditTags({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput("");
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-1 text-xs font-medium text-navy"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="text-navy/50 hover:text-navy"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none"
        />
        <button type="button" onClick={addTag} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
          Add
        </button>
      </div>
    </div>
  );
}
