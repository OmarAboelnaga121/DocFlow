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
              [ CONNECT YOUR STACK ]
            </p>
            <h1
              className="text-[40px] md:text-[56px] font-extrabold leading-[1.1] tracking-[-0.02em] mb-6"
              style={{ color: "#f8fafc" }}
            >
              Works With Your{" "}
              <span style={{ color: "#4edea3" }}>Existing Tools</span>
            </h1>
            <p
              className="max-w-2xl mx-auto text-base leading-relaxed"
              style={{ color: "#94a3b8" }}
            >
              DocFlow plugs into the tools your team already uses — no workflow disruption,
              just immediate codebase intelligence everywhere you work.
            </p>
          </div>

          {/* Integration cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INTEGRATIONS.map((item) => (
              <div
                key={item.name}
                className="flex flex-col gap-4 p-6 rounded-xl transition-all duration-300"
                style={{
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.08)",
                  opacity: item.status === "Available" ? 1 : 0.75,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(78,222,163,0.35)";
                  (e.currentTarget as HTMLDivElement).style.background = "#222a3d";
                  (e.currentTarget as HTMLDivElement).style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.background = "#1e293b";
                  (e.currentTarget as HTMLDivElement).style.opacity =
                    item.status === "Available" ? "1" : "0.75";
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{item.icon}</span>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={
                      item.status === "Available"
                        ? { background: "rgba(78,222,163,0.15)", color: "#4edea3" }
                        : { background: "rgba(148,163,184,0.1)", color: "#94a3b8" }
                    }
                  >
                    {item.status}
                  </span>
                </div>
                <div>
                  <p
                    className="font-mono text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: "#94a3b8" }}
                  >
                    {item.category}
                  </p>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: "#dae2fd" }}
                  >
                    {item.name}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Request integration */}
          <div
            className="mt-16 text-center p-10 rounded-2xl"
            style={{
              background: "#1e293b",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#f8fafc" }}
            >
              Don't see your tool?
            </h2>
            <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
              We're actively expanding our integration catalogue. Reach out and we'll prioritise it.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 font-semibold text-sm px-8 py-3 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: "#10b981", color: "#060e20" }}
            >
              Request an Integration →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
