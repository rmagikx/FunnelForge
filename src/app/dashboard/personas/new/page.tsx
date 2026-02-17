"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BrandPersona, Persona } from "@/lib/types";

const STEPS = ["Details", "Upload", "Analyze", "Review", "Save"];

const ORG_TYPES = ["Company", "Non-profit", "Charity", "Government", "Other"];

/* ━━━ Spinner SVG ━━━ */
function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function NewPersonaPage() {
  const router = useRouter();

  /* ── Wizard state ── */
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /* Step 1 */
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");

  /* Step 2 */
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Step 3 – analysis result */
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [personaData, setPersonaData] = useState<BrandPersona | null>(null);

  /* Step 4 – editable copy */
  const [editableData, setEditableData] = useState<BrandPersona | null>(null);

  /* Step 5 */
  const [isSaving, setIsSaving] = useState(false);

  /* ── File helpers ── */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      setFiles((prev) => [...prev, ...selected]);
    },
    []
  );
  const removeFile = useCallback((i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  /* ── Step transitions ── */

  // Step 1 → Step 2
  function handleDetailsNext() {
    if (!orgName.trim()) {
      setError("Organization name is required.");
      return;
    }
    setError(null);
    setStep(1);
  }

  // Step 2 → Step 3 (upload + analyze)
  async function handleAnalyze() {
    if (files.length === 0) {
      setError("Please upload at least one document.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);

    try {
      /* Send files for parsing + analysis — no DB records created */
      const form = new FormData();
      files.forEach((f) => form.append("files", f));

      const res = await fetch("/api/analyze-documents", {
        method: "POST",
        body: form,
      });
      const text = await res.text();
      let body: Record<string, unknown>;
      try { body = JSON.parse(text); } catch { throw new Error("Analysis timed out or failed — please try again"); }
      if (!res.ok) {
        throw new Error((body.error as string) || "Analysis failed");
      }
      const data = body.personaData as BrandPersona;
      setPersonaData(data);
      setEditableData({ ...data });

      setStep(2); // → show result card (Step 3 UI)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Step 3 → Step 4 (proceed to review)
  function handleProceedToReview() {
    setStep(3);
  }

  // Step 4 → Step 5 (save persona — creates persona + uploads documents)
  async function handleSave() {
    if (!editableData) return;
    setIsSaving(true);
    setError(null);

    try {
      /* 1. Create persona record with analyzed data */
      const createRes = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName.trim(),
          orgType: orgType || undefined,
          personaData: editableData,
        }),
      });
      const createText = await createRes.text();
      let createBody: Record<string, unknown>;
      try { createBody = JSON.parse(createText); } catch { throw new Error("Server returned an unexpected response — please try again"); }
      if (!createRes.ok) {
        throw new Error((createBody.error as string) || "Failed to create persona");
      }
      const persona = createBody.persona as Persona;

      /* 2. Upload documents to storage (linked to the new persona) */
      const form = new FormData();
      form.set("personaId", persona.id);
      files.forEach((f) => form.append("files", f));

      const uploadRes = await fetch("/api/documents", {
        method: "POST",
        body: form,
      });
      if (!uploadRes.ok) {
        // Non-critical — persona is already saved, just log the error
        console.error("Document upload failed after persona creation");
      }

      setStep(4); // success
      setTimeout(() => router.push(`/dashboard/personas/${persona.id}`), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save persona");
    } finally {
      setIsSaving(false);
    }
  }

  /* ── Field updater ── */
  function updateField(field: keyof BrandPersona, value: string | string[]) {
    if (!editableData) return;
    setEditableData({ ...editableData, [field]: value });
  }

  /* ━━━━━━━━━━━━━━━━━━ RENDER ━━━━━━━━━━━━━━━━━━ */
  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
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

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1.5 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                i < step
                  ? "bg-green-500 text-white"
                  : i === step
                  ? "bg-coral text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < step ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-[10px] font-medium hidden sm:inline ${i <= step ? "text-gray-900" : "text-gray-400"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-5 sm:w-8 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── STEP 1: Details ── */}
      {step === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-1">
            Organization details
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Tell us about the organization this persona represents.
          </p>

          <div className="space-y-5">
            <div>
              <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-1">
                Organization / Brand name <span className="text-red-400">*</span>
              </label>
              <input
                id="org-name"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none"
              />
            </div>

            <div>
              <label htmlFor="org-type" className="block text-sm font-medium text-gray-700 mb-1">
                Organization type
              </label>
              <select
                id="org-type"
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none bg-white"
              >
                <option value="">Select type...</option>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDetailsNext}
            className="mt-8 w-full rounded-lg bg-coral px-4 py-3 text-sm font-semibold text-white hover:bg-coral-dark transition-colors"
          >
            Next: Upload Documents
          </button>
        </div>
      )}

      {/* ── STEP 2: Upload ── */}
      {step === 1 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-1">
            Upload brand documents
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Upload pitch decks, website copy, product docs, or audience research.
          </p>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
            }}
            className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center hover:border-coral/50 hover:bg-coral/5 transition-colors"
          >
            <svg className="mx-auto h-10 w-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-gray-600">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, DOCX, TXT, or CSV (max 10 MB each)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="shrink-0 rounded p-1 text-gray-400 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || files.length === 0}
              className="flex-1 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:bg-coral-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Creating Brand Persona...
                </span>
              ) : (
                "Create the Brand Persona"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Analysis result card ── */}
      {step === 2 && personaData && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-navy-light text-white font-heading font-bold text-xl">
              {personaData.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-gray-900">
                {personaData.name}
              </h2>
              <p className="text-sm text-gray-500">{personaData.type}</p>
            </div>
            <span className="ml-auto inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              Analyzed
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-4">{personaData.mission}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <FieldPreview label="Tone" values={personaData.tone} />
            <FieldPreview label="Audience" values={personaData.audience} />
            <FieldPreview label="Values" values={personaData.values} />
            <FieldPreview label="Differentiators" values={personaData.differentiators} />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleProceedToReview}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Review &amp; Edit
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-coral px-4 py-3 text-sm font-semibold text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Saving...
                </span>
              ) : (
                "Save the Brand Persona"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Review & Edit ── */}
      {step === 3 && editableData && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-1">
            Review &amp; edit your persona
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Fine-tune any field before saving.
          </p>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInput label="Persona Name" value={editableData.name} onChange={(v) => updateField("name", v)} />
              <FieldInput label="Type" value={editableData.type} onChange={(v) => updateField("type", v)} />
            </div>
            <FieldTextarea label="Mission" value={editableData.mission} onChange={(v) => updateField("mission", v)} />
            <FieldTags label="Tone" values={editableData.tone} onChange={(v) => updateField("tone", v)} />
            <FieldTags label="Audience" values={editableData.audience} onChange={(v) => updateField("audience", v)} />
            <FieldTags label="Values" values={editableData.values} onChange={(v) => updateField("values", v)} />
            <FieldTags label="Vocabulary" values={editableData.vocabulary} onChange={(v) => updateField("vocabulary", v)} />
            <FieldTags label="Differentiators" values={editableData.differentiators} onChange={(v) => updateField("differentiators", v)} />
            <FieldTags label="Content Patterns" values={editableData.contentPatterns} onChange={(v) => updateField("contentPatterns", v)} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voice Samples</label>
              <div className="space-y-2">
                {editableData.voiceSamples.map((s, i) => (
                  <textarea
                    key={i}
                    value={s}
                    onChange={(e) => {
                      const upd = [...editableData.voiceSamples];
                      upd[i] = e.target.value;
                      updateField("voiceSamples", upd);
                    }}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={() => {
                setEditableData(personaData ? { ...personaData } : null);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Saving...
                </span>
              ) : (
                "Save Persona"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: Success ── */}
      {step === 4 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">
            Persona saved!
          </h2>
          <p className="text-sm text-gray-500">
            Redirecting to your persona...
          </p>
        </div>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━ Helper sub-components ━━━━━━━━━━━━━━ */

function FieldPreview({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide mb-1">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {values.slice(0, 4).map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-medium text-navy"
          >
            {v}
          </span>
        ))}
        {values.length > 4 && (
          <span className="text-[10px] text-gray-400">+{values.length - 4}</span>
        )}
      </div>
    </div>
  );
}

function FieldInput({
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

function FieldTextarea({
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

function FieldTags({
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
        <button
          type="button"
          onClick={addTag}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
