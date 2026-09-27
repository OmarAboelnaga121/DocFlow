import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),transparent_35%),linear-gradient(180deg,#f9f9f9_0%,#ffffff_100%)] px-6 py-12 text-on-background">
      <div className="w-full max-w-xl rounded-[28px] border border-surface-container bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-700">
          ⏸️
        </div>

        <h1 className="text-3xl font-black tracking-[-0.04em] text-text-primary">
          Checkout cancelled
        </h1>

        <p className="mt-4 text-sm leading-6 text-text-secondary">
          You can keep your current plan or try again anytime when you’re ready to upgrade.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Back to pricing
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-surface-container bg-surface px-5 py-3 text-sm font-semibold text-text-primary transition hover:bg-surface-container"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
