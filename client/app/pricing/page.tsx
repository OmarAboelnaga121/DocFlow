"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen pt-28 pb-20 px-6 md:px-8 flex flex-col items-center justify-center"
        style={{ background: "#0b1326", color: "#dae2fd" }}
      >
        <div className="max-w-[680px] w-full mx-auto text-center flex flex-col items-center gap-8">
          {/* Badge */}
          <span
            className="font-mono text-[11px] font-semibold tracking-[0.1em] uppercase px-4 py-1.5 rounded-full"
            style={{ background: "rgba(78,222,163,0.12)", color: "#4edea3", border: "1px solid rgba(78,222,163,0.25)" }}
          >
            Coming Soon
          </span>

          {/* Heading */}
          <h1
            className="text-[40px] md:text-[56px] font-extrabold leading-[1.1] tracking-[-0.02em]"
            style={{ color: "#f8fafc" }}
          >
            Pricing is on{" "}
            <span style={{ color: "#4edea3" }}>its way</span>
          </h1>

          {/* Subtext */}
          <p className="text-base leading-relaxed max-w-lg" style={{ color: "#94a3b8" }}>
            We're finalising our plans to make sure they're genuinely worth your money.
            No filler tiers. No paywalled essentials. Just honest pricing.
          </p>

          {/* Waitlist card */}
          <div
            className="w-full flex flex-col gap-5 p-8 rounded-2xl text-left"
            style={{
              background: "#1e293b",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p
              className="font-mono text-[11px] font-semibold tracking-wider uppercase"
              style={{ color: "#94a3b8" }}
            >
              Get notified when pricing launches
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 bg-transparent rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#dae2fd",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(78,222,163,0.45)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")
                }
              />
              <button
                className="shrink-0 font-semibold text-sm px-6 py-3 rounded-lg transition-opacity hover:opacity-90"
                style={{ background: "#10b981", color: "#060e20" }}
              >
                Notify Me
              </button>
            </div>
            <p className="text-xs" style={{ color: "rgba(148,163,184,0.6)" }}>
              No spam. Unsubscribe any time.
            </p>
          </div>

          {/* Back link */}
          <Link
            href="/"
            className="text-sm transition-colors"
            style={{ color: "#4cd7f6" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#4cd7f6")}
          >
            ← Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
