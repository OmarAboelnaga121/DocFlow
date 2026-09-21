"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-6 md:px-8 flex flex-col items-center justify-center bg-background text-on-background">
        <div className="max-w-[680px] w-full mx-auto text-center flex flex-col items-center gap-8">
          {/* Badge */}
          <span className="font-mono text-[11px] font-semibold tracking-[0.1em] uppercase px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/25">
            Coming Soon
          </span>

          {/* Heading */}
          <h1 className="text-[40px] md:text-[56px] font-extrabold leading-[1.1] tracking-[-0.02em] text-text-primary">
            Pricing is on{" "}
            <span className="text-primary">its way</span>
          </h1>

          {/* Subtext */}
          <p className="text-base leading-relaxed max-w-lg text-text-secondary">
            We&apos;re finalising our plans to make sure they&apos;re genuinely worth your money.
            No filler tiers. No paywalled essentials. Just honest pricing.
          </p>

          {/* Waitlist card */}
          <div className="w-full flex flex-col gap-5 p-8 rounded-2xl text-left bg-white border border-surface-container shadow-sm">
            <p className="font-mono text-[11px] font-semibold tracking-wider uppercase text-secondary">
              Get notified when pricing launches
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 bg-surface-container-low rounded-lg px-4 py-3 text-sm outline-none border border-surface-container text-on-surface placeholder:text-secondary focus:border-primary/50"
              />
              <button className="shrink-0 font-semibold text-sm px-6 py-3 rounded-lg transition-opacity hover:opacity-90 bg-primary-container text-white cursor-pointer shadow-sm">
                Notify Me
              </button>
            </div>
            <p className="text-xs text-secondary">
              No spam. Unsubscribe any time.
            </p>
          </div>

          {/* Back link */}
          <Link
            href="/"
            className="text-sm transition-colors text-secondary hover:text-on-surface"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
