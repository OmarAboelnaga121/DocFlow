"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FEATURES = [
  {
    icon: "🔍",
    title: "Semantic RAG Search",
    description:
      "Ask questions in plain English. DocFlow uses advanced Retrieval-Augmented Generation to find the exact code blocks and context needed to answer your query accurately — no more hunting through hundreds of files.",
  },
  {
    icon: "🧠",
    title: "Logic Extraction",
    description:
      "Automatically untangle complex, undocumented legacy logic. Convert messy spaghetti code into clear, actionable business rules that product teams can actually read and reason about.",
  },
  {
    icon: "🚀",
    title: "Instant Onboarding",
    description:
      "Bring new developers and PMs up to speed in hours, not weeks. Team members can explore the architecture safely without consuming senior developer time.",
  },
  {
    icon: "📂",
    title: "Codebase Indexing",
    description:
      "DocFlow indexes your entire repository — functions, classes, modules, and their relationships — building a living knowledge graph that stays in sync with every commit.",
  },
  {
    icon: "💬",
    title: "Natural Language Q&A",
    description:
      "Product managers and stakeholders can query the codebase as if talking to a senior engineer. Get precise, source-cited answers without writing a single line of code.",
  },
  {
    icon: "🔗",
    title: "GitHub Integration",
    description:
      "Connect your GitHub repositories in one click. DocFlow keeps the index up-to-date automatically, so your team always queries the latest version of the truth.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen pt-28 pb-20 px-6 md:px-8"
        style={{ background: "#0b1326", color: "#dae2fd" }}
      >
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p
              className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase mb-4"
              style={{ color: "#4edea3" }}
            >
              [ WHAT DOCFLOW CAN DO ]
            </p>
            <h1
              className="text-[40px] md:text-[56px] font-extrabold leading-[1.1] tracking-[-0.02em] mb-6"
              style={{ color: "#f8fafc" }}
            >
              Features Built for{" "}
              <span style={{ color: "#4edea3" }}>Modern Teams</span>
            </h1>
            <p
              className="max-w-2xl mx-auto text-base leading-relaxed"
              style={{ color: "#94a3b8" }}
            >
              Everything you need to transform your codebase from a black box into an
              open book — for engineers, product managers, and stakeholders alike.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="flex flex-col gap-4 p-6 rounded-xl transition-all duration-300"
                style={{
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(78,222,163,0.35)";
                  (e.currentTarget as HTMLDivElement).style.background = "#222a3d";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.background = "#1e293b";
                }}
              >
                <span className="text-3xl">{feat.icon}</span>
                <h3
                  className="text-xl font-semibold leading-[1.3] tracking-[-0.01em]"
                  style={{ color: "#dae2fd" }}
                >
                  {feat.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                  {feat.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-semibold text-sm px-8 py-3 rounded transition-opacity hover:opacity-90"
              style={{ background: "#10b981", color: "#060e20" }}
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
