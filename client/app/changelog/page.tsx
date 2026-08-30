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

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "#4edea3", bg: "rgba(78,222,163,0.12)" },
  improvement: { label: "Improved", color: "#4cd7f6", bg: "rgba(76,215,246,0.12)" },
  fix: { label: "Fix", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
};

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen pt-28 pb-20 px-6 md:px-8"
        style={{ background: "#0b1326", color: "#dae2fd" }}
      >
        <div className="max-w-[780px] mx-auto">
          {/* Header */}
          <div className="mb-16">
            <p
              className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase mb-4"
              style={{ color: "#4edea3" }}
            >
              [ WHAT'S NEW ]
            </p>
            <h1
              className="text-[40px] md:text-[52px] font-extrabold leading-[1.1] tracking-[-0.02em] mb-4"
              style={{ color: "#f8fafc" }}
            >
              Changelog
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "#94a3b8" }}>
              A running log of every meaningful change shipped to DocFlow.
            </p>
          </div>

          {/* Entries */}
          <div className="flex flex-col gap-12">
            {CHANGELOG.map((entry) => (
              <div
                key={entry.version}
                className="flex flex-col gap-6 pb-12"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              >
                {/* Version header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: "#f8fafc" }}
                  >
                    {entry.version}
                  </h2>
                  {entry.badge && (
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: "#4edea3", color: "#060e20" }}
                    >
                      {entry.badge}
                    </span>
                  )}
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: "#94a3b8" }}
                  >
                    {entry.date}
                  </span>
                </div>

                {/* Change items */}
                <ul className="flex flex-col gap-3">
                  {entry.changes.map((change, i) => {
                    const style = TYPE_STYLES[change.type];
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded"
                          style={{ background: style.bg, color: style.color }}
                        >
                          {style.label}
                        </span>
                        <span className="text-sm leading-relaxed" style={{ color: "#dae2fd" }}>
                          {change.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>
              Want to follow along? Star the project on GitHub.
            </p>
            <Link
              href="https://github.com/OmarAboelnaga121"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-lg transition-all duration-200"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#f1f5f9",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(45,52,73,0.4)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")
              }
            >
              ⭐ Star on GitHub
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
