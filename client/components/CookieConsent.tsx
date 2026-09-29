"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "docflow_cookie_consent";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        requestAnimationFrame(() => setIsVisible(true));
      }
    } catch {
      // Storage access blocked or restricted
    }
  }, []);

  const handleConsent = (choice: "essential" | "all") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, timestamp: new Date().toISOString() })
      );
    } catch {
      // Storage error fallback
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie preferences"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 p-5 rounded-2xl bg-surface border border-surface-container-high shadow-2xl shadow-black/10 backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3.5">
        <span
          className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5"
          aria-hidden="true"
        >
          cookie
        </span>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-text-primary tracking-tight">
            Cookie & Privacy Notice
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            DocFlow uses strictly necessary cookies to keep you signed in and secure your workspace. We do not sell your personal data. Learn more in our{" "}
            <Link
              href="/legal#cookies"
              className="text-primary font-medium underline underline-offset-2 hover:text-emerald-700 transition-colors"
            >
              Cookie Policy
            </Link>{" "}
            and{" "}
            <Link
              href="/legal#privacy"
              className="text-primary font-medium underline underline-offset-2 hover:text-emerald-700 transition-colors"
            >
              Privacy Notice
            </Link>
            .
          </p>

          <div className="mt-4 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleConsent("essential")}
              className="flex-1 px-3.5 py-2 text-xs font-semibold rounded-lg border border-surface-container-high bg-surface-variant hover:bg-surface-container text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={() => handleConsent("all")}
              className="flex-1 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
