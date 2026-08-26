export default function ProblemSolution() {
  return (
    <section
      id="product"
      className="py-16 px-6 md:px-8 max-w-[1440px] mx-auto"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2
          className="text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-3"
          style={{ color: "#f8fafc" }}
        >
          Why Modern Teams Need DocFlow
        </h2>
        <p className="text-base leading-relaxed" style={{ color: "#94a3b8" }}>
          Bridge the gap between business questions and codebase reality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Problem Card */}
        <div
          className="flex flex-col gap-4 p-8 rounded"
          style={{
            background: "rgba(147, 0, 10, 0.1)",
            border: "1px solid rgba(255, 180, 171, 0.2)",
          }}
        >
          <h3
            className="text-2xl font-semibold flex items-center gap-2 leading-[1.3] tracking-[-0.01em]"
            style={{ color: "#ffb4ab" }}
          >
            <span className="material-symbols-outlined">warning</span>
            The Problem
          </h3>
          <p className="text-base leading-relaxed" style={{ color: "#94a3b8" }}>
            Engineers spend up to 30% of their time answering business logic
            questions or writing documentation that immediately goes out of date.
          </p>
          <div
            className="mt-2 pt-4 flex justify-between items-center"
            style={{ borderTop: "1px solid rgba(255, 180, 171, 0.2)" }}
          >
            <span
              className="font-mono text-[11px] font-medium tracking-[0.06em] uppercase"
              style={{ color: "rgba(255,180,171,0.8)" }}
            >
              Time Wasted
            </span>
            <span
              className="font-mono text-[11px] font-bold tracking-[0.06em]"
              style={{ color: "#ffb4ab" }}
            >
              12hrs/week
            </span>
          </div>
        </div>

        {/* Solution Card */}
        <div
          className="flex flex-col gap-4 p-8 rounded"
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(78, 222, 163, 0.2)",
          }}
        >
          <h3
            className="text-2xl font-semibold flex items-center gap-2 leading-[1.3] tracking-[-0.01em]"
            style={{ color: "#4edea3" }}
          >
            <span className="material-symbols-outlined">bolt</span>
            The Solution
          </h3>
          <p className="text-base leading-relaxed" style={{ color: "#94a3b8" }}>
            DocFlow automatically indexes your codebase, providing instant,
            accurate answers to any stakeholder without interrupting your
            engineering team.
          </p>
          <div
            className="mt-2 pt-4 flex justify-between items-center"
            style={{ borderTop: "1px solid rgba(78, 222, 163, 0.2)" }}
          >
            <span
              className="font-mono text-[11px] font-medium tracking-[0.06em] uppercase"
              style={{ color: "rgba(78,222,163,0.8)" }}
            >
              Time Saved
            </span>
            <span
              className="font-mono text-[11px] font-bold tracking-[0.06em]"
              style={{ color: "#4edea3" }}
            >
              100% Automated
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
