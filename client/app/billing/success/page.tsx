"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { activateSubscription } from "@/lib/api";

function BillingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("Finalizing your premium plan...");

  useEffect(() => {
    const subscriptionId = searchParams.get("subscription_id");

    if (!subscriptionId) {
      setError("PayPal did not return a subscription ID. Please contact support.");
      setIsLoading(false);
      return;
    }

    let active = true;

    const finalize = async () => {
      try {
        const result = await activateSubscription(subscriptionId);
        if (!active) return;

        setMessage(
          result.message || "Your plan is active and your credits have been added."
        );
        setIsLoading(false);

        window.setTimeout(() => {
          router.replace("/dashboard");
        }, 2200);
      } catch (err) {
        if (!active) return;
        const text = err instanceof Error ? err.message : "Unable to activate your subscription.";
        setError(text);
        setIsLoading(false);
      }
    };

    void finalize();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),transparent_35%),linear-gradient(180deg,#f9f9f9_0%,#ffffff_100%)] px-6 py-12 text-on-background">
      <div className="w-full max-w-xl rounded-[28px] border border-surface-container bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
          {isLoading ? "⏳" : error ? "⚠️" : "✅"}
        </div>

        <h1 className="text-center text-3xl font-black tracking-[-0.04em] text-text-primary">
          {error ? "Payment needs attention" : "Your premium plan is ready"}
        </h1>

        <p className="mt-4 text-center text-sm leading-6 text-text-secondary">
          {error || message}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {!error ? (
            <button
              type="button"
              onClick={() => router.replace("/dashboard")}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Go to dashboard
            </button>
          ) : (
            <>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Try again
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-surface-container bg-surface px-5 py-3 text-sm font-semibold text-text-primary transition hover:bg-surface-container"
              >
                Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),transparent_35%),linear-gradient(180deg,#f9f9f9_0%,#ffffff_100%)] px-6 py-12 text-on-background">
          <div className="w-full max-w-xl rounded-[28px] border border-surface-container bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] text-center font-medium">
            Loading billing status...
          </div>
        </main>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}
