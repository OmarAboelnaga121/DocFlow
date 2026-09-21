"use client";

export default function CoreFeatures() {
  return (
    <section
      id="how-it-works"
      className="w-full bg-surface-container-lowest py-16 md:py-24 border-b border-surface-container"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
            Supercharge Your Workflow
          </h2>
          <p className="mt-3 text-base sm:text-lg text-secondary leading-relaxed">
            Purpose-built intelligence engines designed to keep engineers building and executives informed.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 — Deep RAG Code Search */}
          <div className="group rounded-2xl bg-white p-8 border border-surface-container shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container-low text-emerald-600 shadow-inner">
                <i className="fa-solid fa-magnifying-glass text-2xl transition-transform duration-200 group-hover:scale-110" />
              </div>

              <h3 className="mt-6 text-xl sm:text-2xl font-bold text-on-surface">
                Deep RAG Code Search
              </h3>
              <p className="mt-2 text-sm text-secondary leading-relaxed">
                Semantic vector search trained specifically on syntax trees, interface contracts, and commit histories. Query complex logic in plain English.
              </p>
            </div>

            <div className="mt-6 rounded-lg bg-surface-container-low p-3 font-mono text-xs text-secondary border border-surface-container">
              <div className="text-on-surface font-semibold">&gt; &quot;Where is credit limit computed?&quot;</div>
              <div className="text-emerald-600 font-semibold mt-1">Found in src/policies/credit.py:88</div>
            </div>
          </div>

          {/* Card 2 — Automated Logic Extraction */}
          <div className="group rounded-2xl bg-white p-8 border border-surface-container shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container-low text-emerald-600 shadow-inner">
                <i className="fa-solid fa-diagram-project text-2xl transition-transform duration-200 group-hover:scale-110" />
              </div>

              <h3 className="mt-6 text-xl sm:text-2xl font-bold text-on-surface">
                Automated Logic Extraction
              </h3>
              <p className="mt-2 text-sm text-secondary leading-relaxed">
                Reverse-engineers business formulas, pricing rules, and compliance boundaries directly from controller source code into accessible specs.
              </p>
            </div>

            <div className="mt-6 rounded-lg bg-surface-container-low p-3 font-mono text-xs text-secondary border border-surface-container">
              <div className="text-on-surface font-semibold">Rule: TieredDiscountPolicy</div>
              <div className="text-emerald-600 font-semibold mt-1">Exported as OAS 3.1 &amp; Markdown</div>
            </div>
          </div>

          {/* Card 3 — Instant Team Onboarding */}
          <div className="group rounded-2xl bg-white p-8 border border-surface-container shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container-low text-emerald-600 shadow-inner">
                <i className="fa-solid fa-users-gear text-2xl transition-transform duration-200 group-hover:scale-110" />
              </div>

              <h3 className="mt-6 text-xl sm:text-2xl font-bold text-on-surface">
                Instant Team Onboarding
              </h3>
              <p className="mt-2 text-sm text-secondary leading-relaxed">
                New engineers ship their first PR on Day 1 with guided walkthroughs, interactive architecture sandboxes, and automated dependency trees.
              </p>
            </div>

            <div className="mt-6 rounded-lg bg-surface-container-low p-3 font-mono text-xs text-secondary border border-surface-container">
              <div className="text-on-surface font-semibold">Median time to first PR:</div>
              <div className="text-emerald-600 font-semibold mt-1">Reduced from 11 days to 3 hours</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
