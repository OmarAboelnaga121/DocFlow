export default function CtaBanner() {
  return (
    <section className="py-16 px-6 md:px-8 max-w-[1440px] mx-auto">
      <div
        className="relative overflow-hidden rounded-xl p-12 text-center flex flex-col items-center gap-6"
        style={{
          background: "rgba(49, 57, 77, 0.2)",
          border: "1px solid rgba(78, 222, 163, 0.2)",
        }}
      >
        {/* Glow blob */}
        <div
          className="absolute inset-0 rounded-full blur-3xl animate-pulse-glow pointer-events-none"
          style={{ background: "rgba(78, 222, 163, 0.05)" }}
        />

        <h2
          className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] relative z-10"
          style={{ color: "#f8fafc" }}
        >
          Stop guessing. Start shipping.
        </h2>
        <p
          className="text-base leading-relaxed max-w-lg relative z-10"
          style={{ color: "#94a3b8" }}
        >
          Give your entire team instant, plain-English access to your
          codebase&apos;s business logic today.
        </p>
        <button
          id="cta-trial-btn"
          className="relative z-10 text-base font-semibold px-8 py-3 rounded-[6px] transition-opacity hover:opacity-90 cursor-pointer mt-2"
          style={{ background: "#10b981", color: "#0f172a" }}
        >
          Start Your Free Trial
        </button>
      </div>
    </section>
  );
}
