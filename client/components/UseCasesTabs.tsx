"use client";

import { useState } from "react";

type TabId = "product" | "engineering" | "design";

interface TabConfig {
  id: TabId;
  label: string;
  eyebrow: string;
  heading: string;
  description: string;
  bullets: string[];
}

const TABS: TabConfig[] = [
  {
    id: "product",
    label: "Product",
    eyebrow: "PRODUCT VELOCITY",
    heading: "Unblock Product Decisions",
    description:
      "Product managers can validate technical feasibility, verify data structures, and inspect business logic boundaries without creating Jira tickets or scheduling engineer syncs.",
    bullets: [
      "Inspect production schema constraints without waiting for engineering syncs",
      "Trace live user event triggers directly to telemetry tables",
      "Verify feature flag dependencies and rollout stages in seconds",
      "Export executive architecture summaries with one click",
    ],
  },
  {
    id: "engineering",
    label: "Engineering",
    eyebrow: "ENGINEERING EXCELLENCE",
    heading: "Zero Context Switching for Developers",
    description:
      "Generate documentation automatically via git hooks without changing your IDE workflow. Let CI/CD validate doc freshness before merging.",
    bullets: [
      "Auto-generate OpenAPI specs directly from controllers and typed handlers",
      "Automated breaking change detection in GitHub/GitLab Pull Requests",
      "Two-way synchronized Markdown embeds straight from GitHub READMEs",
      "Automatic schema diff checks during pull request evaluation",
    ],
  },
  {
    id: "design",
    label: "Design",
    eyebrow: "DESIGN SYSTEMS ALIGNMENT",
    heading: "Connect Design Tokens to Code",
    description:
      "Bridge Figma tokens with frontend component primitives. Catch color mismatches, spacing drifts, and deprecated component usage automatically.",
    bullets: [
      "Bidirectional token sync between Figma Styles and Tailwind tokens",
      "Component usage metrics: inspect dead variants in live repos",
      "Automated accessibility audit telemetry embedded in doc pages",
      "Living styleguide documentation auto-updated on release",
    ],
  },
];

export default function UseCasesTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("product");
  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <section
      id="use-cases"
      className="w-full bg-surface-container-lowest py-16 md:py-24 border-b border-surface-container"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
            Built for Cross-Functional Teams
          </h2>

          {/* Interactive Tabs */}
          <div
            className="mt-6 inline-flex rounded-xl bg-surface-container-low p-1.5 shadow-inner border border-surface-container"
            role="tablist"
          >
            {TABS.map((t) => {
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  id={`tab-btn-${t.id}`}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(t.id)}
                  className={`rounded-lg px-6 py-2 font-semibold text-sm transition-all cursor-pointer ${
                    isSelected
                      ? "bg-surface-container-lowest text-on-surface shadow-sm"
                      : "text-secondary hover:text-on-surface font-medium"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Surface */}
        <div className="mt-10 rounded-2xl bg-surface-container-lowest p-8 lg:p-12 shadow-lg border border-surface-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column — Explanatory Content */}
            <div className="lg:col-span-6">
              <span className="font-mono text-xs uppercase text-emerald-600 tracking-wider font-bold">
                {currentTab.eyebrow}
              </span>
              <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {currentTab.heading}
              </h3>
              <p className="mt-3 text-sm sm:text-base text-secondary leading-relaxed">
                {currentTab.description}
              </p>

              <ul className="mt-6 space-y-3.5">
                {currentTab.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-emerald-500 mt-0.5 text-[20px] shrink-0">
                      check_circle
                    </span>
                    <span className="text-xs sm:text-sm text-on-surface font-medium">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column — White Mode Code/Terminal Window */}
            <div className="lg:col-span-6">
              {/* PRODUCT TERMINAL (White Mode) */}
              {activeTab === "product" && (
                <div className="rounded-xl bg-surface-container-low p-6 text-on-surface shadow-sm border border-surface-container font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-surface-container pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-xs text-secondary font-sans font-medium">
                      DocFlow Copilot Terminal
                    </span>
                    <span className="rounded bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-800 font-semibold">
                      SOC2 Verified
                    </span>
                  </div>

                  <div className="mt-4 space-y-4 font-sans">
                    {/* User Prompt */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold text-on-surface">
                        PM
                      </div>
                      <div className="rounded-xl bg-white p-3 text-xs text-on-surface border border-surface-container shadow-sm">
                        Does the enterprise checkout endpoint support multi-currency tax exemptions?
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-sm">
                        DF
                      </div>
                      <div className="rounded-xl bg-white p-3 text-xs text-on-surface border border-emerald-200 shadow-sm flex-1">
                        <p className="font-semibold text-emerald-700">
                          Yes. Referenced in `/services/billing/tax.ts:42`
                        </p>
                        <p className="mt-1 text-secondary">
                          Supports ISO-4217 currencies with automated VIES VAT verification.
                        </p>
                        <div className="mt-3 rounded bg-surface-container-low p-2.5 font-mono text-[11px] text-on-surface border border-surface-container overflow-x-auto">
                          <div>&#123;</div>
                          <div className="pl-3">
                            <span className="text-emerald-700">&quot;exemptionAllowed&quot;</span>: <span className="text-amber-600">true</span>,
                          </div>
                          <div className="pl-3">
                            <span className="text-emerald-700">&quot;supportedCurrencies&quot;</span>: [<span className="text-blue-600">&quot;USD&quot;</span>, <span className="text-blue-600">&quot;EUR&quot;</span>, <span className="text-blue-600">&quot;GBP&quot;</span>],
                          </div>
                          <div className="pl-3">
                            <span className="text-emerald-700">&quot;viesValidation&quot;</span>: <span className="text-blue-600">&quot;strict&quot;</span>
                          </div>
                          <div>&#125;</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ENGINEERING CI/CD PIPELINE (White Mode) */}
              {activeTab === "engineering" && (
                <div className="rounded-xl bg-surface-container-low p-6 text-on-surface shadow-sm border border-surface-container font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-surface-container pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-xs text-secondary font-sans font-medium">
                      .github/workflows/docflow-sync.yml
                    </span>
                    <span className="rounded bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-800 font-semibold">
                      CI Native
                    </span>
                  </div>

                  <pre className="mt-3 text-on-surface leading-5 overflow-x-auto bg-white p-3 rounded-lg border border-surface-container shadow-inner">
                    <span className="text-purple-600 font-semibold">name</span>: DocFlow CI Sync{"\n"}
                    <span className="text-purple-600 font-semibold">on</span>: [push, pull_request]{"\n"}
                    <span className="text-purple-600 font-semibold">jobs</span>:{"\n"}
                    {"  "}<span className="text-blue-600 font-semibold">doc-verification</span>:{"\n"}
                    {"    "}<span className="text-purple-600 font-semibold">runs-on</span>: ubuntu-latest{"\n"}
                    {"    "}<span className="text-purple-600 font-semibold">steps</span>:{"\n"}
                    {"      "}- <span className="text-blue-600 font-semibold">uses</span>: actions/checkout@v4{"\n"}
                    {"      "}- <span className="text-blue-600 font-semibold">uses</span>: docflow/action-ast-validator@v3{"\n"}
                    {"        "}<span className="text-purple-600 font-semibold">with</span>:{"\n"}
                    {"          "}<span className="text-orange-600">fail-on-drift</span>: true{"\n"}
                    {"          "}<span className="text-orange-600">target-spec</span>: <span className="text-emerald-700">./api/openapi.json</span>
                  </pre>
                  <div className="mt-4 rounded bg-emerald-100 p-2.5 text-emerald-800 border-l-2 border-emerald-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                    <span>✓ AST verification passed (0 drifts detected in 142 files)</span>
                  </div>
                </div>
              )}

              {/* DESIGN SYSTEM TOKEN MANIFEST (White Mode) */}
              {activeTab === "design" && (
                <div className="rounded-xl bg-surface-container-low p-6 text-on-surface shadow-sm border border-surface-container font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-surface-container pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-xs text-secondary font-sans font-medium">
                      tokens.json (Figma to Tailwind)
                    </span>
                    <span className="rounded bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-800 font-semibold">
                      Live Token Sync
                    </span>
                  </div>

                  <pre className="mt-3 text-on-surface leading-5 overflow-x-auto bg-white p-3 rounded-lg border border-surface-container shadow-inner">
                    &#123;{"\n"}
                    {"  "}<span className="text-emerald-700 font-semibold">&quot;color.primary&quot;</span>: &#123;{"\n"}
                    {"    "}<span className="text-blue-600">&quot;figma&quot;</span>: <span className="text-amber-600">&quot;#34C759&quot;</span>,{"\n"}
                    {"    "}<span className="text-blue-600">&quot;tailwind&quot;</span>: <span className="text-amber-600">&quot;var(--color-primary)&quot;</span>,{"\n"}
                    {"    "}<span className="text-blue-600">&quot;status&quot;</span>: <span className="text-emerald-700">&quot;100% In Sync&quot;</span>{"\n"}
                    {"  "}&#125;,{"\n"}
                    {"  "}<span className="text-emerald-700 font-semibold">&quot;component.Button&quot;</span>: &#123;{"\n"}
                    {"    "}<span className="text-blue-600">&quot;usageCount&quot;</span>: <span className="text-amber-600">284</span>,{"\n"}
                    {"    "}<span className="text-blue-600">&quot;deprecatedVariants&quot;</span>: <span className="text-amber-600">0</span>{"\n"}
                    {"  "}&#125;{"\n"}
                    &#125;
                  </pre>
                  <div className="mt-4 rounded bg-emerald-100 p-2.5 text-emerald-800 border-l-2 border-emerald-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-base">sync</span>
                    <span>✓ Tokens synced with Figma library v2.4 (0 mismatches)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
