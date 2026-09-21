"use client";

interface TechItem {
  name: string;
  category: string;
  icon?: string;
}

const TECH_ROW_ONE: TechItem[] = [
  { name: "Next.js", category: "Frontend" },
  { name: "NestJS", category: "Backend" },
  { name: "TypeScript", category: "Language" },
  { name: "Python", category: "Language / AI" },
  { name: "FastAPI", category: "Backend" },
  { name: "Go", category: "Systems" },
  { name: "Rust", category: "Systems" },
  { name: "Docker", category: "DevOps" },
  { name: "Kubernetes", category: "Orchestration" },
  { name: "GraphQL", category: "API" },
  { name: "Node.js", category: "Runtime" },
  { name: "React", category: "Frontend" },
];

const TECH_ROW_TWO: TechItem[] = [
  { name: "PostgreSQL", category: "Database" },
  { name: "Redis", category: "Cache / Queue" },
  { name: "Prisma", category: "ORM" },
  { name: "Drizzle ORM", category: "ORM" },
  { name: "MongoDB", category: "Database" },
  { name: "Supabase", category: "BaaS" },
  { name: "Apache Kafka", category: "Streaming" },
  { name: "RabbitMQ", category: "Messaging" },
  { name: "Elasticsearch", category: "Search" },
  { name: "ClickHouse", category: "Analytics" },
  { name: "AWS", category: "Cloud" },
  { name: "TailwindCSS", category: "Styling" },
];

export default function TechArchitecture() {
  return (
    <section
      id="architecture"
      className="py-16 md:py-20 max-w-[1440px] mx-auto text-center overflow-hidden relative bg-surface-container-low border-b border-surface-container"
    >
      <div className="px-6 md:px-8 mb-10">
        <h2 className="text-2xl md:text-3xl font-bold leading-[1.3] tracking-[-0.01em] mb-3 text-on-surface">
          Built for Any Tech Stack
        </h2>
        <p className="text-sm md:text-base max-w-2xl mx-auto text-secondary">
          Universal AST parsers and protocol analyzers adapt to your languages,
          frameworks, databases, and infrastructure.
        </p>
      </div>

      {/* Infinite Scrolling Tickers Container */}
      <div className="relative w-full overflow-hidden py-2 space-y-3 mb-10">
        {/* Left & Right Edge Gradient Fade Overlays — White */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 left-0 w-24 md:w-44 z-10"
          style={{
            background:
              "linear-gradient(to right, #f3f3f4 0%, rgba(243, 243, 244, 0) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute top-0 bottom-0 right-0 w-24 md:w-44 z-10"
          style={{
            background:
              "linear-gradient(to left, #f3f3f4 0%, rgba(243, 243, 244, 0) 100%)",
          }}
        />

        {/* Row 1: Leftward Marquee */}
        <div className="flex overflow-hidden py-1.5">
          <div className="animate-marquee-left flex gap-4 pr-4 py-1">
            {[...TECH_ROW_ONE, ...TECH_ROW_ONE].map((tech, idx) => (
              <TechBadge key={`row1-${tech.name}-${idx}`} tech={tech} />
            ))}
          </div>
        </div>

        {/* Row 2: Rightward Marquee (Opposite Direction) */}
        <div className="flex overflow-hidden py-1.5">
          <div className="animate-marquee-right flex gap-4 pr-4 py-1">
            {[...TECH_ROW_TWO, ...TECH_ROW_TWO].map((tech, idx) => (
              <TechBadge key={`row2-${tech.name}-${idx}`} tech={tech} />
            ))}
          </div>
        </div>
      </div>

      <p className="font-mono text-[11px] font-medium tracking-[0.06em] uppercase flex items-center justify-center gap-1.5 px-6 text-secondary">
        <span className="material-symbols-outlined text-[14px] text-emerald-600">lock</span>
        Enterprise-Grade Privacy: Your code never trains public models.
      </p>
    </section>
  );
}

function TechBadge({ tech }: { tech: TechItem }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-lg border font-mono text-sm font-medium whitespace-nowrap select-none transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:shadow-md bg-white border-surface-container text-on-surface shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span className="text-on-surface font-semibold">{tech.name}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider bg-surface-container-low text-secondary border border-surface-container">
        {tech.category}
      </span>
    </div>
  );
}
