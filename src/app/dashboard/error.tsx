"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  const isSupabaseError =
    error.message?.includes("Supabase") ||
    error.message?.includes("fetch") ||
    error.message?.includes("network");

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-lg text-center py-16">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <svg
            className="h-7 w-7 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">
          {isSupabaseError ? "Connection issue" : "Something went wrong"}
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          {isSupabaseError
            ? "We couldn\u2019t reach our servers. Check your internet connection and try again."
            : "An unexpected error occurred. Please try again."}
        </p>

        {error.message && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 text-left mx-auto max-w-sm">
            <span className="font-semibold">Details: </span>
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-dark transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
