import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <span className="font-heading text-8xl font-bold text-gray-200">
            404
          </span>
        </div>

        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
          Page not found
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-dark transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
