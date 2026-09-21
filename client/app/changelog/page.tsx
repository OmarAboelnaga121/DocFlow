"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const CHANGELOG = [
  {
    version: "v0.4.0",
    date: "August 2026",
    badge: "Latest",
    changes: [
      { type: "new", text: "GitHub OAuth — sign in with your GitHub account" },
      { type: "new", text: "Codebase indexing pipeline — automatic re-index on push" },
      { type: "new", text: "Semantic RAG search with source citations" },
      { type: "improvement", text: "Faster query response times (avg 40% reduction)" },
      { type: "fix", text: "Resolved token expiry loop on long sessions" },
    ],
  },
  {
    version: "v0.3.0",
    date: "July 2026",
    badge: null,
    changes: [
      { type: "new", text: "Logic extraction — convert code to plain-English business rules" },
      { type: "new", text: "User avatar upload via Cloudinary" },
      { type: "improvement", text: "Redesigned onboarding flow" },
      { type: "fix", text: "Fixed pagination bug in document list view" },
    ],
  },
  {
    version: "v0.2.0",
    date: "June 2026",
    badge: null,
    changes: [
      { type: "new", text: "Dashboard — unified view of repositories and queries" },
      { type: "new", text: "Email/password authentication with JWT" },
      { type: "improvement", text: "Dark mode polish across all pages" },
    ],
  },
  {
    version: "v0.1.0",
    date: "May 2026",
    badge: null,
    changes: [
      { type: "new", text: "Initial public release of DocFlow" },
      { type: "new", text: "Basic repository connection and file browsing" },
    ],
  },
];

const TYPE_STYLES: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "text-primary bg-primary/10 border-primary/25" },
  improvement: { label: "Improved", className: "text-secondary bg-secondary/10 border-secondary/25" },
  fix: { label: "Fix", className: "text-orange-400 bg-orange-500/10 border-orange-500/25" },
};

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-6 md:px-8 bg-background text-on-background">
        <div className="max-w-[780px] mx-auto">
          {/* Header */}
          <div className="mb-16">
            <p className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase mb-4 text-primary">
              [ WHAT&apos;S NEW ]
            </p>
            <h1 className="text-[40px] md:text-[52px] font-extrabold leading-[1.1] tracking-[-0.02em] mb-4 text-text-primary">
              Changelog
            </h1>
            <p className="text-base leading-relaxed text-text-secondary">
              A running log of every meaningful change shipped to DocFlow.
            </p>
          </div>

          {/* Entries */}
          <div className="flex flex-col gap-12">
            {CHANGELOG.map((entry) => (
              <div
                key={entry.version}
                className="flex flex-col gap-6 pb-12 border-b border-surface-container"
              >
                {/* Version header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-on-surface">
                    {entry.version}
                  </h2>
                  {entry.badge && (
                    <span className="font-mono text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {entry.badge}
                    </span>
                  )}
                  <span className="text-sm font-mono text-secondary">
                    {entry.date}
                  </span>
                </div>

                {/* Changes list */}
                <ul className="flex flex-col gap-3">
                  {entry.changes.map((item, idx) => {
                    const style = TYPE_STYLES[item.type] ?? {
                      label: item.type,
                      className: "text-secondary bg-surface-container-low border-surface-container",
                    };
                    return (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span
                          className={`shrink-0 font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${style.className}`}
                        >
                          {style.label}
                        </span>
                        <span className="leading-relaxed text-on-surface">
                          {item.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Subscribe CTA */}
          <div className="mt-16 p-8 rounded-2xl text-center bg-surface-container-low border border-surface-container">
            <h2 className="text-xl font-bold text-on-surface mb-2">
              Stay up to date
            </h2>
            <p className="text-sm text-secondary mb-6">
              Get notified whenever a major version lands.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer shadow-sm bg-primary-container text-white hover:bg-emerald-600"
            >
              Join the Beta Free
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
