"use client";

import Link from "next/link";
import AntigravityCanvas from "./AntigravityCanvas";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden bg-background pt-32 pb-20 lg:pt-40 lg:pb-28 border-b border-border-hairline"
    >
      {/* Google Antigravity-Style Interactive Particle Physics Canvas */}
      <AntigravityCanvas />

      {/* Ambient Top Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-[800px] rounded-full bg-emerald-500/10 blur-3xl -z-10" />

      {/* 2. Ambient Architectural Dot Mesh Pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#10b98118_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_45%,#000_70%,transparent_100%)] opacity-85" />

      {/* 3. Soft Ambient Corner Glows */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-1/2 -left-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl -z-10" />

      {/* Main Centered Content Container */}
      <div className="relative z-10 mx-auto max-w-[1040px] px-6 md:px-8 text-center flex flex-col items-center">

        {/* Announcement Pill */}
        <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-1.5 shadow-xs border border-surface-container-high transition-transform duration-200 hover:scale-[1.02]">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
            DOCFLOW ENGINE V2.0 IS LIVE
          </span>
          <span className="material-symbols-outlined text-[14px] text-text-secondary">
            arrow_forward
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="mt-8 text-4xl sm:text-5xl lg:text-[62px] font-extrabold tracking-tight text-text-primary leading-[1.08] max-w-4xl">
          Bridge the Gap Between Your{" "}
          <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent underline decoration-emerald-500/30 underline-offset-8">
            Codebase
          </span>{" "}
          and Your Business
        </h1>

        {/* Subhead */}
        <p className="mt-6 max-w-2xl text-base sm:text-lg lg:text-xl text-text-secondary leading-relaxed font-normal">
          DocFlow synchronizes documentation, schema models, and business logic into real-time interactive intelligence for engineering and product leadership.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            id="hero-trial-btn"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white shadow-[0_6px_20px_rgba(5,150,105,0.32)] transition-all hover:bg-emerald-700 hover:shadow-[0_8px_28px_rgba(5,150,105,0.42)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 cursor-pointer"
          >
            Start Free Trial
            <span className="material-symbols-outlined ml-1.5 text-[18px]">
              chevron_right
            </span>
          </Link>

          <Link
            href="/dashboard"
            id="hero-demo-btn"
            className="inline-flex items-center justify-center rounded-xl bg-white border border-surface-container-high px-7 py-4 text-sm font-semibold text-text-primary shadow-xs transition-all hover:bg-surface-container-low hover:border-surface-container-highest hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 cursor-pointer"
          >
            <span className="material-symbols-outlined mr-2 text-[20px] text-text-secondary">
              play_circle
            </span>
            Explore Interactive Demo
          </Link>
        </div>

        {/* Architectural Capabilities Dock */}
        <div className="mt-16 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="group rounded-2xl bg-white/85 backdrop-blur-sm p-5 border border-surface-container shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-500/40 flex items-center gap-4 text-left">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 shadow-inner">
              <span className="material-symbols-outlined text-[22px]">account_tree</span>
            </div>
            <div>
              <div className="font-mono text-sm font-bold text-text-primary tracking-tight">
                AST Parser
              </div>
              <div className="text-xs text-text-secondary leading-tight mt-0.5">
                Automated Code Extraction
              </div>
            </div>
          </div>

          <div className="group rounded-2xl bg-white/85 backdrop-blur-sm p-5 border border-surface-container shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-500/40 flex items-center gap-4 text-left">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 shadow-inner">
              <span className="material-symbols-outlined text-[22px]">dataset</span>
            </div>
            <div>
              <div className="font-mono text-sm font-bold text-text-primary tracking-tight">
                pgvector
              </div>
              <div className="text-xs text-text-secondary leading-tight mt-0.5">
                Semantic RAG Retrieval
              </div>
            </div>
          </div>

          <div className="group rounded-2xl bg-white/85 backdrop-blur-sm p-5 border border-surface-container shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-500/40 flex items-center gap-4 text-left">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 shadow-inner">
              <span className="material-symbols-outlined text-[22px]">sync</span>
            </div>
            <div>
              <div className="font-mono text-sm font-bold text-text-primary tracking-tight">
                Git Sync
              </div>
              <div className="text-xs text-text-secondary leading-tight mt-0.5">
                Continuous Drift Detection
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
