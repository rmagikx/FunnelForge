"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePersonas } from "@/hooks/usePersonas";
import type { BrandPersona } from "@/lib/types";

const STEPS = ["Upload Documents", "Review Persona", "Save & Go"];

export default function OnboardingFlow() {
  const router = useRouter();
  const { createPersona, reanalyzePersona } = usePersonas();

  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 state
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [personaData, setPersonaData] = useState<BrandPersona | null>(null);
  const [editableData, setEditableData] = useState<BrandPersona | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      setFiles((prev) => [...prev, ...selected]);
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Step 1 → Step 2
  async function handleUploadAndAnalyze() {
    if (files.length === 0) {
      setError("Please upload at least one document.");
      return;
    }
    setError(null);
    setIsProcessing(true);

    try {
      // Create persona
      const persona = await createPersona(orgName || "My Brand", orgName || undefined);
      if (!persona) throw new Error("Failed to create persona");
      setPersonaId(persona.id);

      // Upload documents
      const formData = new FormData();
      formData.set("personaId", persona.id);
      files.forEach((file) => formData.append("files", file));

      const uploadRes = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const body = await uploadRes.json();
        throw new Error(body.error || "Upload failed");
      }

      // Analyze persona
      const analyzed = await reanalyzePersona(persona.id);
      if (!analyzed) throw new Error("Analysis failed");

      const data = analyzed.persona_data as unknown as BrandPersona;
      setPersonaData(data);
      setEditableData({ ...data });
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  }

  // Step 2 → Step 3 (save edits + redirect)
  async function handleSavePersona() {
    if (!personaId || !editableData) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch(`/api/personas/${personaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaData: editableData }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save");
      }
      setStep(2);
      // Brief pause to show success, then redirect
      setTimeout(() => {
        router.push(`/dashboard/generate?persona=${personaId}`);
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save persona");
    } finally {
      setIsProcessing(false);
    }
  }

  function updateField(field: keyof BrandPersona, value: string | string[]) {
    if (!editableData) return;
    setEditableData({ ...editableData, [field]: value });
  }

  return (
    <div className="animate-fade-in">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i <= step
                  ? "bg-coral text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < step ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${i <= step ? "text-gray-900" : "text-gray-400"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 sm:w-12 ${i < step ? "bg-coral" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">
            Let&apos;s build your brand persona
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Upload documents about your brand — website copy, pitch decks, product docs, or audience research.
          </p>

          {/* Org name */}
          <div className="mb-6">
            <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-1">
              Organization / Brand name
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

          {/* File drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = Array.from(e.dataTransfer.files);
              setFiles((prev) => [...prev, ...dropped]);
            }}
            className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center hover:border-coral/50 hover:bg-coral/5 transition-colors"
          >
            <svg className="mx-auto h-10 w-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-gray-600">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, or CSV (max 10 MB each)</p>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
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

          <button
            type="button"
            onClick={handleUploadAndAnalyze}
            disabled={isProcessing || files.length === 0}
            className="mt-6 w-full rounded-lg bg-coral px-4 py-3 text-sm font-semibold text-white hover:bg-coral-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading &amp; Analyzing...
              </span>
            ) : (
              "Upload & Build Persona"
            )}
          </button>
        </div>
      )}

      {/* Step 2: Review persona */}
      {step === 1 && editableData && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-1">
            Review your brand persona
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            We analyzed your documents and built this persona. Edit any field before saving.
          </p>

          <div className="space-y-5">
            {/* Name + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInput label="Persona Name" value={editableData.name} onChange={(v) => updateField("name", v)} />
              <FieldInput label="Type" value={editableData.type} onChange={(v) => updateField("type", v)} />
            </div>

            {/* Mission */}
            <FieldTextarea label="Mission" value={editableData.mission} onChange={(v) => updateField("mission", v)} />

            {/* Arrays */}
            <FieldTags label="Tone" values={editableData.tone} onChange={(v) => updateField("tone", v)} />
            <FieldTags label="Target Audience" values={editableData.audience} onChange={(v) => updateField("audience", v)} />
            <FieldTags label="Brand Values" values={editableData.values} onChange={(v) => updateField("values", v)} />
            <FieldTags label="Vocabulary" values={editableData.vocabulary} onChange={(v) => updateField("vocabulary", v)} />
            <FieldTags label="Differentiators" values={editableData.differentiators} onChange={(v) => updateField("differentiators", v)} />
            <FieldTags label="Content Patterns" values={editableData.contentPatterns} onChange={(v) => updateField("contentPatterns", v)} />

            {/* Voice samples */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voice Samples</label>
              <div className="space-y-2">
                {editableData.voiceSamples.map((sample, i) => (
                  <textarea
                    key={i}
                    value={sample}
                    onChange={(e) => {
                      const updated = [...editableData.voiceSamples];
                      updated[i] = e.target.value;
                      updateField("voiceSamples", updated);
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
              Reset changes
            </button>
            <button
              type="button"
              onClick={handleSavePersona}
              disabled={isProcessing}
              className="flex-1 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Saving..." : "Save Persona & Start Generating"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 2 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">
            Persona saved!
          </h2>
          <p className="text-sm text-gray-500">
            Redirecting you to the content generator...
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Helper sub-components ── */

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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
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
