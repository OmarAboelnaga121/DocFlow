"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const INTEGRATIONS = [
  {
    icon: "🐙",
    name: "GitHub",
    category: "Source Control",
    description:
      "Connect any GitHub repository in one click. DocFlow auto-indexes on every push and keeps your knowledge graph in sync.",
    status: "Available",
  },
  {
    icon: "🦊",
    name: "GitLab",
    category: "Source Control",
    description:
      "Full support for GitLab repos — self-hosted or cloud. Webhooks ensure real-time indexing with zero manual effort.",
    status: "Coming Soon",
  },
  {
    icon: "🪣",
    name: "Bitbucket",
    category: "Source Control",
    description:
      "Atlassian Bitbucket integration for teams already invested in the Jira ecosystem.",
    status: "Coming Soon",
  },
  {
    icon: "💬",
    name: "Slack",
    category: "Communication",
    description:
      "Query your codebase directly from Slack. Ask DocFlow questions in any channel and get cited answers without leaving your workflow.",
    status: "Coming Soon",
  },
  {
    icon: "🗂️",
    name: "Notion",
    category: "Documentation",
    description:
      "Push auto-generated architecture summaries and business-rule extracts directly into your Notion workspace.",
    status: "Coming Soon",
  },
  {
    icon: "🔷",
    name: "Linear",
    category: "Project Management",
    description:
      "Link issues to the exact code that implements them. DocFlow enriches Linear tickets with codebase context automatically.",
    status: "Coming Soon",
  },
];

export default function IntegrationsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-6 md:px-8 bg-background text-on-background">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase mb-4 text-primary">
              [ CONNECT YOUR STACK ]
            </p>
            <h1 className="text-[40px] md:text-[56px] font-extrabold leading-[1.1] tracking-[-0.02em] mb-6 text-text-primary">
              Works With Your{" "}
              <span className="text-primary">Existing Tools</span>
            </h1>
            <p className="max-w-2xl mx-auto text-base leading-relaxed text-text-secondary">
              DocFlow plugs into the tools your team already uses — no workflow disruption,
              just immediate codebase intelligence everywhere you work.
            </p>
          </div>

          {/* Integration cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INTEGRATIONS.map((item) => (
              <div
                key={item.name}
                className={`flex flex-col gap-4 p-6 rounded-xl transition-all duration-300 bg-surface border border-white/[0.08] hover:border-primary/35 hover:bg-surface-variant ${
                  item.status === "Available" ? "opacity-100" : "opacity-75"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{item.icon}</span>
                  <span
                    className={`font-mono text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                      item.status === "Available"
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-white/[0.06] text-text-secondary border border-white/[0.08]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-text-secondary mb-1">
                    {item.category}
                  </p>
                  <h2 className="text-lg font-bold tracking-tight text-text-primary">
                    {item.name}
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Request integration banner */}
          <div className="mt-16 p-8 rounded-2xl text-center bg-surface border border-white/[0.08]">
            <h2 className="text-lg font-bold text-text-primary mb-2">
              Don&apos;t see your tool here?
            </h2>
            <p className="text-sm text-text-secondary mb-5">
              We&apos;re adding integrations fast. Tell us what you&apos;d like to see next.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-colors text-secondary hover:text-white"
            >
              Request an integration →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
