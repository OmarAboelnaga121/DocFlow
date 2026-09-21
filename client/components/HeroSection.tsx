"use client";

import Link from "next/link";
import { useState } from "react";

export default function HeroSection() {
  const [copiedSwagger, setCopiedSwagger] = useState(false);
  const [activeQuarter, setActiveQuarter] = useState<string>("Q4");

  const quarterValues: Record<string, { val: string; height: string; yoy: string; barBg: string }> = {
    Q1: { val: "$2.1M", height: "h-10", yoy: "+18.2%", barBg: "bg-emerald-100 hover:bg-emerald-500" },
    Q2: { val: "$2.9M", height: "h-14", yoy: "+24.5%", barBg: "bg-emerald-200 hover:bg-emerald-500" },
    Q3: { val: "$3.8M", height: "h-20", yoy: "+31.0%", barBg: "bg-emerald-300 hover:bg-emerald-500" },
    Q4: { val: "$4.8M", height: "h-24", yoy: "+38.4%", barBg: "bg-emerald-500" },
  };

  const handleSwaggerExport = () => {
    setCopiedSwagger(true);
    setTimeout(() => setCopiedSwagger(false), 2200);
  };

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden bg-background pt-28 pb-16 lg:pt-36 lg:pb-24 border-b border-border-hairline"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mx-auto max-w-[1280px] px-6 md:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Column — Value Proposition */}
          <div className="flex flex-col items-start lg:col-span-7">
            {/* Announcement Pill */}
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3.5 py-1.5 shadow-sm border border-surface-container-high">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                DOCFLOW ENGINE V1.4 IS LIVE
              </span>
              <span className="material-symbols-outlined text-[14px] text-text-secondary">
                arrow_forward
              </span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-3xl sm:text-4xl lg:text-[54px] font-extrabold tracking-tight text-text-primary leading-[1.12]">
              Bridge the Gap Between Your{" "}
              <span className="text-primary underline decoration-primary/30 underline-offset-8">
                Codebase
              </span>{" "}
              and Your Business
            </h1>

            {/* Subhead */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-text-secondary leading-relaxed">
              DocFlow synchronizes documentation, schema models, and business logic into real-time interactive intelligence for engineering and product leadership.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                id="hero-trial-btn"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all hover:bg-emerald-600 hover:shadow-[0_6px_22px_rgba(16,185,129,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Start Free Trial
                <span className="material-symbols-outlined ml-1.5 text-[18px]">
                  chevron_right
                </span>
              </Link>

              <Link
                href="/dashboard"
                id="hero-demo-btn"
                className="inline-flex items-center justify-center rounded-lg bg-white border border-surface-container-high px-6 py-3.5 text-sm font-semibold text-text-primary shadow-sm transition-all hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <span className="material-symbols-outlined mr-2 text-[20px] text-text-secondary">
                  play_circle
                </span>
                Explore Interactive Demo
              </Link>
            </div>

            {/* Hero Stats Row */}
            <div className="mt-10 grid grid-cols-3 border-t border-surface-container pt-8 w-full divide-x divide-surface-container-highest">
              <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4">
                <span className="font-mono text-xl sm:text-2xl font-bold text-text-primary tracking-tight whitespace-nowrap">
                  99.98%
                </span>
                <span className="text-[11px] sm:text-xs leading-tight text-text-secondary">
                  AST Sync
                  <br />
                  Reliability
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4">
                <span className="font-mono text-xl sm:text-2xl font-bold text-text-primary tracking-tight whitespace-nowrap">
                  &lt; 140ms
                </span>
                <span className="text-[11px] sm:text-xs leading-tight text-text-secondary">
                  Semantic
                  <br />
                  Search
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4">
                <span className="font-mono text-xl sm:text-2xl font-bold text-text-primary tracking-tight whitespace-nowrap">
                  0 Drift
                </span>
                <span className="text-[11px] sm:text-xs leading-tight text-text-secondary">
                  Continuous
                  <br />
                  AST Sync
                </span>
              </div>
            </div>
          </div>

          {/* Right Column — Code-to-Business Interactive Visual Graphic */}
          <div className="w-full max-w-[560px] lg:col-span-5 mx-auto lg:mx-0 relative">
            <div className="relative rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-surface-container">
              {/* IDE Code Window Mockup (White Mode) */}
              <div className="overflow-hidden rounded-xl bg-surface-container-low p-4 text-on-surface shadow-sm border border-surface-container">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="font-mono text-[11px] text-secondary font-medium">
                    services/finance/revenue.ts
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="font-mono text-[10px] text-emerald-800 font-semibold">
                      SYNCED
                    </span>
                  </div>
                </div>

                <pre className="font-mono text-xs leading-5 overflow-x-auto mt-3 bg-white p-3.5 rounded-lg border border-surface-container shadow-inner text-on-surface">
                  <span className="text-purple-600 font-semibold">export async function</span>{" "}
                  <span className="text-blue-600 font-semibold">fetchQuarterlyRevenue</span>(
                  {"\n"}  <span className="text-orange-600">params</span>:{" "}
                  <span className="text-emerald-700 font-medium">RevenueQuery</span>
                  {"\n"}): <span className="text-teal-600 font-medium">Promise</span>&lt;
                  <span className="text-emerald-700 font-medium">RevenueMetrics</span>&gt; &#123;
                  {"\n"}  <span className="text-slate-400">// Automatic pipeline trigger via AST</span>
                  {"\n"}  <span className="text-purple-600 font-semibold">const</span> ledger ={" "}
                  <span className="text-purple-600 font-semibold">await</span> db.ledger.aggregate(&#123;
                  {"\n"}    <span className="text-blue-600">where</span>: &#123; fiscalYear: params.year &#125;,
                  {"\n"}    <span className="text-blue-600">sum</span>: &#123; totalNet:{" "}
                  <span className="text-amber-600">true</span> &#125;
                  {"\n"}  &#125;);
                  {"\n"}  <span className="text-purple-600 font-semibold">return</span> calculateGrowth(ledger.sum);
                  {"\n"}&#125;
                </pre>
              </div>

              {/* Flow Conduit Indicator */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-emerald-500/40" />
                </div>
                <div className="relative z-10 flex items-center gap-2 rounded-full bg-emerald-500 px-3.5 py-1 text-white shadow-sm font-mono text-[10px] uppercase font-bold tracking-wider">
                  <span className="material-symbols-outlined text-[15px] animate-spin">
                    sync
                  </span>
                  <span>Live AST Conduit</span>
                </div>
              </div>

              {/* Business Output Widget */}
              <div className="rounded-xl bg-surface-container-low p-4 shadow-sm border border-surface-container">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase text-text-secondary tracking-wider font-semibold">
                      Active Metric Extraction
                    </div>
                    <div className="text-base font-bold text-text-primary">
                      Quarterly Revenue
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800 font-mono text-xs font-semibold">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">
                      trending_up
                    </span>
                    {quarterValues[activeQuarter].yoy} YoY
                  </div>
                </div>

                {/* Sparkline Bars */}
                <div className="mt-4 flex items-end justify-between gap-2.5 h-28 pt-2">
                  {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => {
                    const isSelected = activeQuarter === q;
                    const data = quarterValues[q];
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setActiveQuarter(q)}
                        className="flex flex-col items-center flex-1 h-full justify-end cursor-pointer group focus:outline-none"
                      >
                        <div
                          className={`w-full rounded-t transition-all relative ${
                            data.height
                          } ${
                            isSelected
                              ? "bg-emerald-500 shadow-sm"
                              : "bg-emerald-100 hover:bg-emerald-500"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-on-surface px-1.5 py-0.5 font-mono text-[9px] text-white shadow-sm whitespace-nowrap">
                              {data.val}
                            </span>
                          )}
                        </div>
                        <span
                          className={`font-mono text-[10px] mt-1.5 transition-colors ${
                            isSelected
                              ? "text-on-surface font-bold"
                              : "text-text-secondary group-hover:text-text-primary"
                          }`}
                        >
                          {q}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Widget Footer */}
                <div className="mt-4 flex items-center justify-between text-text-secondary pt-3 border-t border-surface-container text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-600 font-medium">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">
                      check_circle
                    </span>
                    Schema verified
                  </div>
                  <span className="font-mono text-[11px] text-text-secondary font-semibold">
                    TTL: 42s
                  </span>
                  <button
                    type="button"
                    onClick={handleSwaggerExport}
                    className="font-mono text-[11px] text-emerald-600 font-bold hover:underline cursor-pointer transition-colors"
                  >
                    {copiedSwagger ? "✓ Exported OAS 3.1" : "1-click Swagger export"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
