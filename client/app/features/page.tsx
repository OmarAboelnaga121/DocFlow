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
      <main className="min-h-screen pt-28 pb-20 px-6 md:px-8 bg-background text-on-background">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase mb-4 text-primary">
              [ WHAT DOCFLOW CAN DO ]
            </p>
            <h1 className="text-[40px] md:text-[56px] font-extrabold leading-[1.1] tracking-[-0.02em] mb-6 text-text-primary">
              Features Built for{" "}
              <span className="text-primary">Modern Teams</span>
            </h1>
            <p className="max-w-2xl mx-auto text-base leading-relaxed text-text-secondary">
              Everything you need to transform your codebase from a black box into an
              open book — for engineers, product managers, and stakeholders alike.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="flex flex-col gap-4 p-6 rounded-xl transition-all duration-300 bg-surface border border-white/[0.08] hover:border-primary/35 hover:bg-surface-variant"
              >
                <span className="text-3xl">{feat.icon}</span>
                <h2 className="text-xl font-bold tracking-tight text-text-primary">
                  {feat.title}
                </h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="mt-20 p-10 rounded-2xl text-center bg-surface-container-low border border-white/[0.08]">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary mb-3">
              Ready to explore your codebase?
            </h2>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto text-sm">
              Connect your first repository in under 2 minutes. No credit card required.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer shadow-lg hover:shadow-primary/30 bg-primary-container text-surface-container-lowest hover:bg-primary"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
