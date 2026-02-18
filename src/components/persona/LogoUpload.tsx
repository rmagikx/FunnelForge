"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_DIMENSION = 256; // px

interface LogoUploadProps {
  /** If provided, uploads directly via API. If omitted, calls onLogoChange with the file. */
  personaId?: string;
  /** Current logo URL to display */
  currentLogoUrl?: string | null;
  /** Fallback initial letter for the avatar */
  fallbackInitial?: string;
  /** Callback when logo changes — receives the File and a preview data URL */
  onLogoChange?: (file: File | null, previewUrl: string | null) => void;
  /** Callback after a successful API upload — receives the new public URL */
  onUploadComplete?: (logoUrl: string) => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Resize an image file to fit within MAX_DIMENSION × MAX_DIMENSION using canvas.
 * Returns a new File with the resized image.
 */
function resizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // SVGs don't need resizing
    if (file.type === "image/svg+xml") {
      resolve(file);
      return;
    }

    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only resize if larger than max dimension
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(file);
        return;
      }

      // Scale down proportionally
      if (width > height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const resized = new File([blob], file.name, {
            type: file.type === "image/webp" ? "image/webp" : "image/png",
          });
          resolve(resized);
        },
        file.type === "image/webp" ? "image/webp" : "image/png",
        0.9
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

export default function LogoUpload({
  personaId,
  currentLogoUrl,
  onLogoChange,
  onUploadComplete,
  size = "md",
}: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = preview || currentLogoUrl;

  const sizeClasses = {
    sm: "h-11 w-11 text-lg",
    md: "h-16 w-16 text-2xl",
    lg: "h-20 w-20 text-3xl",
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Please upload a JPEG, PNG, SVG, or WebP image.");
        return;
      }

      // Validate size
      if (file.size > MAX_SIZE) {
        setError("Image must be under 2 MB.");
        return;
      }

      // Resize
      let resized: File;
      try {
        resized = await resizeImage(file);
      } catch {
        setError("Failed to process image.");
        return;
      }

      // Create preview
      const previewUrl = URL.createObjectURL(resized);
      setPreview(previewUrl);

      // If we have a personaId, upload directly
      if (personaId) {
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("logo", resized);

          const res = await fetch(`/api/personas/${personaId}/logo`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Upload failed");
          }

          const data = await res.json();
          onUploadComplete?.(data.logoUrl);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
          setPreview(null);
        } finally {
          setIsUploading(false);
        }
      } else {
        // Creation mode — pass file to parent
        onLogoChange?.(resized, previewUrl);
      }
    },
    [personaId, onLogoChange, onUploadComplete]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemove = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setError(null);
      setPreview(null);

      if (personaId && currentLogoUrl) {
        setIsUploading(true);
        try {
          const res = await fetch(`/api/personas/${personaId}/logo`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Delete failed");
          }
          onUploadComplete?.("");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Delete failed");
        } finally {
          setIsUploading(false);
        }
      } else {
        onLogoChange?.(null, null);
      }
    },
    [personaId, currentLogoUrl, onLogoChange, onUploadComplete]
  );

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="relative group">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          disabled={isUploading}
          className={`relative ${sizeClasses[size]} rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-coral/50 transition-colors cursor-pointer flex items-center justify-center bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {isUploading ? (
            <svg
              className="h-5 w-5 animate-spin text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : displayUrl ? (
            <Image
              src={displayUrl}
              alt="Brand logo"
              width={256}
              height={256}
              className="h-full w-full object-contain p-1"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                />
              </svg>
            </div>
          )}

          {/* Hover overlay */}
          {!isUploading && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
                />
              </svg>
            </div>
          )}
        </button>

        {/* Remove button */}
        {displayUrl && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Remove logo"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/svg+xml,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      <p className="text-xs text-gray-400">
        {displayUrl ? "Click to change logo" : "Upload logo (JPEG, PNG, SVG, WebP)"}
      </p>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
