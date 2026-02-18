import Link from "next/link";

const CHANNELS = [
  { name: "LinkedIn", icon: "in" },
  { name: "Instagram", icon: "ig" },
  { name: "Twitter / X", icon: "x" },
  { name: "Email", icon: "@" },
  { name: "Blog", icon: "b" },
  { name: "Facebook", icon: "fb" },
  { name: "TikTok", icon: "tt" },
];

const STEPS = [
  {
    num: "01",
    title: "Upload",
    description:
      "Drop your brand guidelines, pitch decks, website copy, or any documents that capture your voice.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Analyze",
    description:
      "Our AI reads every document and distills your unique brand persona — tone, audience, values, and vocabulary.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Generate",
    description:
      "Describe your marketing challenge and we produce full-funnel content across every channel — instantly.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We cut our content creation time by 80%. FunnelForge gets our brand voice right every single time.",
    name: "Sarah Chen",
    title: "Head of Marketing, NovaTech",
    avatar: "SC",
  },
  {
    quote:
      "The full-funnel approach means we get awareness, consideration, and conversion copy all at once. Game changer.",
    name: "Marcus Rivera",
    title: "Founder, GrowthLab Agency",
    avatar: "MR",
  },
  {
    quote:
      "I uploaded our brand guidelines once and now every piece of content sounds exactly like us.",
    name: "Priya Patel",
    title: "CMO, EverBloom",
    avatar: "PP",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ───── Navbar ───── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-1.5 font-heading text-xl font-bold text-navy">
            FunnelForge
            <span className="rounded bg-navy/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-navy/60">
              Beta
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 h-[600px] w-[600px] rounded-full bg-coral/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 h-[500px] w-[500px] rounded-full bg-navy/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center rounded-full border border-coral/20 bg-coral/5 px-3 py-1 text-xs font-medium text-coral mb-6">
              <svg className="mr-1.5 h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
              AI-Powered Content Engine
            </div>

            <h1 className="font-heading text-4xl font-bold tracking-tight text-navy sm:text-5xl lg:text-6xl leading-[1.1]">
              Turn your brand voice into a{" "}
              <span className="text-coral">full-funnel content engine</span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Upload your brand documents. Our AI learns your unique voice and
              generates awareness, consideration, and conversion content across
              7 channels — in seconds.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-coral px-8 py-4 text-base font-bold text-white shadow-lg shadow-coral/25 hover:bg-coral-dark hover:shadow-coral/30 transition-all"
              >
                Get Started Free
                <svg className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/auth/login"
                className="w-full sm:w-auto text-center rounded-xl border border-gray-300 px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign in
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              No credit card required. Free to try.
            </p>
          </div>
        </div>
      </section>

      {/* ───── 3-Step Visual ───── */}
      <section className="border-t border-gray-100 bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
              Three steps to content that converts
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              From raw brand assets to full-funnel marketing content in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-gray-200 to-transparent -translate-y-1/2 z-0" />
                )}

                <div className="relative rounded-2xl border border-gray-200 bg-white p-5 sm:p-8 text-center hover:border-coral/30 hover:shadow-lg transition-all duration-300">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-navy to-navy-light text-white mb-5">
                    {step.icon}
                  </div>
                  <div className="absolute top-4 right-4 font-heading text-5xl font-bold text-gray-100">
                    {step.num}
                  </div>
                  <h3 className="font-heading text-xl font-bold text-navy mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Channels Grid ───── */}
      <section className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
              One click, seven channels
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Generate tailored content for every platform — all with your
              authentic brand voice.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
            {CHANNELS.map((ch) => (
              <div
                key={ch.name}
                className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-5 py-3 hover:border-coral/30 hover:shadow-md transition-all duration-200"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-xs font-bold text-white uppercase">
                  {ch.icon}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {ch.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 rounded-2xl border border-gray-200 bg-white px-5 sm:px-8 py-5 sm:py-6">
              <div className="text-center sm:text-left">
                <p className="font-heading text-lg font-bold text-navy">
                  Full-funnel for every channel
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Each channel gets Awareness, Consideration &amp; Conversion content.
                </p>
              </div>
              <div className="flex gap-2">
                {["Awareness", "Consideration", "Conversion"].map((stage, i) => {
                  const colors = [
                    "bg-blue-50 text-blue-700",
                    "bg-amber-50 text-amber-700",
                    "bg-green-50 text-green-700",
                  ];
                  return (
                    <span
                      key={stage}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${colors[i]}`}
                    >
                      {stage}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section className="border-t border-gray-100 bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
              Loved by marketing teams
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow duration-200"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-4 w-4 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                    </svg>
                  ))}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-navy to-navy-light text-xs font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-400">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
            Ready to forge your funnel?
          </h2>
          <p className="mt-4 text-gray-500 max-w-md mx-auto">
            Start generating brand-perfect content in minutes. No credit card,
            no commitment.
          </p>
          <Link
            href="/auth/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-coral px-8 py-4 text-base font-bold text-white shadow-lg shadow-coral/25 hover:bg-coral-dark transition-all"
          >
            Get Started Free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-gray-100 bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-heading text-lg font-bold">
              FunnelForge
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/50">
                Beta
              </span>
            </span>
            <p className="text-sm text-gray-400">
              &copy; 2025 FunnelForge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
