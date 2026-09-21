"use client";

export default function ProblemSolution() {
  return (
    <section
      id="product"
      className="w-full bg-surface-container-low py-16 md:py-24 border-b border-border-hairline"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary font-semibold mb-3">
            <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
            PARADIGM SHIFT
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Why Modern Teams Need DocFlow
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
            Traditional docs rot the minute code commits. DocFlow creates a self-healing knowledge bridge.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* The Problem Card */}
          <div className="rounded-2xl bg-[#FFF1F2] border border-rose-200 p-7 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 border border-rose-200 px-3 py-1 font-mono text-[11px] uppercase font-bold text-[#9F1239]">
                <span className="material-symbols-outlined text-[14px] text-rose-600">
                  warning
                </span>
                The Problem
              </span>
              <span className="font-mono text-xs text-[#9F1239] font-medium">
                Friction &amp; Blindspots
              </span>
            </div>

            {/* Simulated Broken Incidents */}
            <div className="my-6 space-y-2.5">
              <div className="flex items-center justify-between rounded-lg bg-white/95 p-3 shadow-sm border border-rose-100">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-rose-600 text-[18px]">
                    broken_image
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-text-primary">
                    Docs out of sync by 42 days
                  </span>
                </div>
                <span className="rounded bg-rose-100 px-2 py-0.5 font-mono text-[10px] text-rose-700 font-bold border border-rose-200">
                  STALE
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white/95 p-3 shadow-sm border border-rose-100">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-rose-600 text-[18px]">
                    sync_problem
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-text-primary">
                    4 deprecated API endpoints in production
                  </span>
                </div>
                <span className="rounded bg-rose-100 px-2 py-0.5 font-mono text-[10px] text-rose-700 font-bold border border-rose-200">
                  FAIL
                </span>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-text-primary">
              The Tribal Knowledge Silo
            </h3>
            <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
              Engineers spend 14+ hours every week answering duplicate schema queries, deciphering deprecated endpoints, and manually patching outdated Confluence runbooks.
            </p>

            <div className="mt-6 pt-4 flex justify-between items-center border-t border-rose-200 text-xs font-mono">
              <span className="text-[#9F1239] uppercase font-semibold">Time Wasted</span>
              <span className="font-bold text-[#9F1239]">14+ hrs / eng / week</span>
            </div>
          </div>

          {/* The Solution Card */}
          <div className="rounded-2xl bg-[#ECFDF5] border border-emerald-200 p-7 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 font-mono text-[11px] uppercase font-bold text-emerald-800">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">
                  verified
                </span>
                The Solution
              </span>
              <span className="font-mono text-xs text-emerald-800 font-medium">
                Continuous Telemetry
              </span>
            </div>

            {/* Simulated Live Synchronized Items */}
            <div className="my-6 space-y-2.5">
              <div className="flex items-center justify-between rounded-lg bg-white/95 p-3 shadow-sm border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                    electric_bolt
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-text-primary">
                    Self-healing AST sync: 100% active
                  </span>
                </div>
                <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] text-emerald-700 font-bold border border-emerald-200">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white/95 p-3 shadow-sm border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                    bolt
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-text-primary">
                    Instant answers in Slack &amp; PR reviews
                  </span>
                </div>
                <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] text-emerald-700 font-bold border border-emerald-200">
                  &lt; 0.2s
                </span>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-text-primary">
              Continuous Code-to-Product Intelligence
            </h3>
            <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
              DocFlow monitors git commits, parses ASTs, and generates verified, interactive documentation with executable business intelligence that never goes stale.
            </p>

            <div className="mt-6 pt-4 flex justify-between items-center border-t border-emerald-200 text-xs font-mono">
              <span className="text-emerald-800 uppercase font-semibold">Time Saved</span>
              <span className="font-bold text-emerald-700">100% Automated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
