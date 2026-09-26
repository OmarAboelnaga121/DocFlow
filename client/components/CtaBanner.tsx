import Link from "next/link";

export default function CtaBanner() {
  return (
    <section
      id="trial"
      className="relative isolate w-full overflow-hidden border-t border-surface-container bg-[radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.18),transparent_58%),linear-gradient(135deg,rgba(16,185,129,0.08),var(--color-surface-container-low)_48%,rgba(16,185,129,0.05))] py-20 lg:py-28"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-8 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute -right-12 bottom-4 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/20 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.18)_52%,transparent_100%)] opacity-80" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 text-center md:px-8">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-white/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Try it free
          </span>

          <h2 className="mt-6 text-3xl font-black tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            Start shipping better docs in less than a week.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Turn scattered repo knowledge into a live, searchable system your team can trust from product planning to deployment.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(16,185,129,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Start free trial
              <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
            </Link>

            <Link
              href="/features"
              className="inline-flex items-center justify-center rounded-xl border border-surface-container-high bg-white/70 px-6 py-3.5 text-sm font-semibold text-text-primary shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              See platform overview
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
