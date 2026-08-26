"use client";

const FEATURES = [
  {
    icon: "search",
    title: "Semantic RAG Search",
    description:
      "Ask questions in plain English. DocFlow uses advanced RAG to find the exact code blocks and context needed to answer your query accurately.",
  },
  {
    icon: "memory",
    title: "Logic Extraction",
    description:
      "Automatically untangle complex, undocumented legacy logic. Convert messy spaghetti code into clear, actionable business rules.",
  },
  {
    icon: "group_add",
    title: "Instant Onboarding",
    description:
      "Bring new developers and PMs up to speed instantly. They can explore the architecture safely without needing hours of senior dev time.",
  },
];

export default function CoreFeatures() {
  return (
    <section
      id="how-it-works"
      className="py-16 px-6 md:px-8 max-w-[1440px] mx-auto text-center"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <h2
        className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] mb-12"
        style={{ color: "#f8fafc" }}
      >
        Supercharge Your Workflow
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
        {FEATURES.map((feat) => (
          <div
            key={feat.title}
            className="cursor-pointer flex flex-col gap-4 p-6 rounded group transition-all duration-300"
            style={{
              background: "#1e293b",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "rgba(78,222,163,0.3)";
              (e.currentTarget as HTMLDivElement).style.background = "#222a3d";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLDivElement).style.background = "#1e293b";
            }}
          >
            <span
              className="material-symbols-outlined text-[32px]"
              style={{ color: "#4edea3" }}
            >
              {feat.icon}
            </span>
            <h3
              className="text-2xl font-semibold leading-[1.3] tracking-[-0.01em]"
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
    </section>
  );
}
