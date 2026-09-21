import Link from "next/link";

export default function CtaBanner() {
  return (
    <section
      id="trial"
      className="relative w-full overflow-hidden bg-surface-container-low border-t border-surface-container py-20 lg:py-28"
    >
      {/* Ambient glowing spotlight */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-80 w-[700px] rounded-full bg-emerald-500/10 blur-3xl animate-pulse-glow" />

      <div className="mx-auto max-w-[1280px] px-6 md:px-8 relative z-10 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-extrabold tracking-tight text-on-surface leading-[1.12]">
          Stop guessing. Start shipping.
        </h2>
        <p className="mt-5 max-w-xl mx-auto text-base sm:text-lg text-secondary leading-relaxed">
          Join hundreds of high-velocity engineering organizations using DocFlow to eliminate documentation debt forever.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center">
          <Link
            href="/register"
            id="cta-trial-btn"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-10 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl transition-all hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 cursor-pointer"
          >
            Start Your Free Trial
            <span className="material-symbols-outlined ml-2 text-[20px]">
              arrow_forward
            </span>
          </Link>

          {/* Trust points */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm text-secondary">
            <span>14-day unlimited trial</span>
            <span>•</span>
            <span>No credit card required</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">
                verified_user
              </span>
              SOC2 Type II Certified
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
