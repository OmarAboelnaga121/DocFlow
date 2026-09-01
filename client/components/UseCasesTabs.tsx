"use client";

import { useState } from "react";

type Tab = {
  label: string;
  heading: string;
  body: string;
  bullets: string[];
  queryText: string;
  answerText: string;
  sourceFile: string;
};

const TABS: Tab[] = [
  {
    label: "Product Managers",
    heading: "Unblock Product Decisions",
    body: "Stop waiting on engineering to answer \"how this works currently\". Query the codebase in plain English to understand existing logic, validate feature constraints, and plan roadmaps with accurate technical context.",
    bullets: [
      "Instant answers to logic queries",
      "Verify current state before writing specs",
    ],
    queryText: "What happens if a user subscription expires during a billing cycle?",
    answerText:
      "The system grants a 3-day grace period. After that, access is restricted to read-only mode until payment succeeds.",
    sourceFile: "src/billing/subscription.service.ts",
  },
  {
    label: "Stakeholders",
    heading: "Get Real Business Context",
    body: "Skip the intermediary. Ask DocFlow directly about revenue logic, compliance constraints, or customer-facing behaviour—and get answers grounded in actual production code.",
    bullets: [
      "No more engineering translation layers",
      "On-demand compliance and audit trails",
    ],
    queryText: "How does our refund policy work for annual subscribers?",
    answerText:
      "Annual subscribers are eligible for a pro-rated refund within the first 30 days of their billing period. After that, only service credits are issued.",
    sourceFile: "src/payments/refund.service.ts",
  },
  {
    label: "Engineering",
    heading: "Ship Faster with Confidence",
    body: "Onboard faster, reduce context-switching costs, and document automatically. DocFlow keeps living documentation in sync with your codebase—no manual updates required.",
    bullets: [
      "Auto-generated, always-accurate docs",
      "Instant codebase orientation for new hires",
    ],
    queryText: "Where is the rate-limiting logic for the public API?",
    answerText:
      "Rate limiting is enforced via a ThrottlerGuard applied globally in AppModule. The default limit is 100 requests per minute per IP, configurable via environment variables.",
    sourceFile: "src/app.module.ts",
  },
];

export default function UseCasesTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const tab = TABS[activeTab];

  return (
    <section
      id="use-cases"
      className="py-16 px-6 md:px-8 max-w-[1440px] mx-auto border-t border-white/[0.08]"
    >
      <h2 className="text-2xl font-bold leading-[1.3] tracking-[-0.01em] mb-10 text-center text-text-primary">
        Built for Cross-Functional Teams
      </h2>

      <div className="flex flex-col items-center">
        {/* Tab Headers */}
        <div
          className="flex mb-10 w-full max-w-2xl justify-center gap-8 border-b border-white/[0.08]"
          role="tablist"
        >
          {TABS.map((t, i) => (
            <button
              key={t.label}
              id={`tab-${i}`}
              role="tab"
              aria-selected={activeTab === i}
              onClick={() => setActiveTab(i)}
              className={`pb-3 font-mono text-[11px] font-medium tracking-[0.06em] uppercase transition-colors cursor-pointer border-b-2 ${
                activeTab === i
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-on-background"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-4xl w-full"
        >
          {/* Copy */}
          <div className="flex flex-col gap-4">
            <h3 className="text-2xl font-semibold leading-[1.3] tracking-[-0.01em] text-on-background">
              {tab.heading}
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              {tab.body}
            </p>
            <ul className="flex flex-col gap-2 mt-2">
              {tab.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-center gap-3 text-sm text-on-background"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    check
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Mock Chat */}
          <div className="flex flex-col gap-3 p-5 rounded bg-surface border border-white/[0.08]">
            {/* Query bubble */}
            <div className="font-mono text-xs p-3 rounded bg-surface-container-lowest text-on-surface-variant">
              &gt; {tab.queryText}
            </div>

            {/* Answer bubble */}
            <div className="p-3 text-sm leading-relaxed border-l-2 border-primary bg-primary/5 text-on-background">
              {tab.answerText}
              <br />
              <span className="font-mono text-[11px] block mt-2 text-on-surface-variant">
                [{tab.sourceFile}]
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
