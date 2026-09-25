"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createPaymentSession, getUserProfile } from "@/lib/api";

const plans = [
  {
    name: "Free",
    price: 0,
    description: "For solo developers testing DocFlow on a small codebase and learning the workflow.",
    cta: "Get started",
    featured: false,
    highlight: "Best for trying it out",
    features: [
      "2 repositories included",
      "50 AI credits/month",
      "Git repo ingestion",
      "Context-aware chat over one repo",
      "JWT + GitHub auth",
    ],
  },
  {
    name: "Pro",
    price: 20,
    description: "For developers and small teams who need more repo storage, indexing, and deeper code understanding.",
    cta: "Upgrade to Pro",
    featured: true,
    highlight: "Most popular",
    features: [
      "7 repositories included",
      "1,000 AI credits/month",
      "Incremental repo resync",
      "pgvector semantic search over code",
      "Repository API + page extraction",
    ],
  },
  {
    name: "Premium",
    price: 75,
    description: "For larger teams and heavier codebase work that need higher scale and more support.",
    cta: "Go Premium",
    featured: false,
    highlight: "For scale",
    features: [
      "Up to 50 repositories (2GB total)",
      "5,000 AI credits/month",
      "Higher-volume repository indexing",
      "Advanced repo analysis workflows",
      "Priority onboarding support",
    ],
  },
];

const comparisonRows = [
  {
    label: "Repositories",
    values: ["2", "7", "Up to 50 (2GB total)"],
  },
  {
    label: "AI credits",
    values: ["50/month", "1,000/month", "5,000/month"],
  },
  {
    label: "Repo ingestion",
    values: ["Git import", "Git import + sync", "Git import + larger sync capacity"],
  },
  {
    label: "Code indexing",
    values: ["Basic file indexing", "pgvector semantic retrieval", "High-volume vector indexing"],
  },
  {
    label: "AI usage",
    values: ["Repo chat", "Repo chat + API/page extraction", "Deep repo analysis + higher quota"],
  },
  {
    label: "Authentication",
    values: ["JWT + GitHub auth", "JWT + GitHub auth", "JWT + GitHub auth + support"],
  },
];

const benefitCards = [
  {
    icon: "download",
    title: "Import repos",
    description:
      "Every plan supports importing Git repositories and indexing code for AI-powered questions and repo understanding.",
  },
  {
    icon: "search",
    title: "Search the codebase",
    description:
      "Pro adds stronger semantic search, incremental sync, and deeper repository analysis built on the project’s pgvector pipeline.",
  },
  {
    icon: "smart_toy",
    title: "Ask questions",
    description:
      "The AI can answer repo-specific questions using indexed code, discovered APIs, and frontend route structure from the ingested project.",
  },
];

export default function PricingPage() {
  const router = useRouter();

  const makePaymentLink = async (planName: string) => {
    try {
      // check if the user is logged in
      const profile = await getUserProfile();

      if (!profile?.id) {
        router.push("/login");
        return;
      }

      if (planName === "Free") {
        router.push("/dashboard");
        return;
      }

      // create a payment session for the selected plan
      const planTier = planName === "Pro" ? "PRO" : "PREMIUM";
      const { approvalUrl } = await createPaymentSession(planTier);

      // redirect the user to the payment session URL
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = approvalUrl;
    } catch (error) {
      // handle any errors that may occur
      console.error("Failed to start payment flow:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while starting the payment flow.";
      window.alert(message);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-28 pb-20 px-6 md:px-8 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),transparent_35%),linear-gradient(180deg,#f9f9f9_0%,#ffffff_100%)] text-on-background">
        <div className="mx-auto max-w-7xl">
          <section className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Pricing
            </span>

            <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] text-text-primary md:text-6xl">
              Pick the plan that matches your scale.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-text-secondary md:text-lg">
              Start simple, upgrade when your team grows, and unlock the power to manage more repos,
              deeper automation, and premium support when you need it.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-text-secondary">
              <span className="rounded-full border border-surface-container bg-surface px-3 py-1.5">
                Monthly billing
              </span>
              <span className="rounded-full border border-surface-container bg-surface px-3 py-1.5">
                Cancel anytime
              </span>
              <span className="rounded-full border border-surface-container bg-surface px-3 py-1.5">
                No hidden fees
              </span>
            </div>
          </section>

          <section className="mt-16 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex h-full flex-col rounded-[28px] border p-7 shadow-[0_20px_60px_rgba(15,23,42,0.04)] transition-all duration-300 ${
                  plan.featured
                    ? "border-primary bg-gradient-to-b from-emerald-50 to-white shadow-[0_24px_60px_rgba(16,185,129,0.18)] ring-2 ring-primary/20"
                    : "border-surface-container bg-white"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-lg shadow-emerald-500/20">
                    {plan.highlight}
                  </div>
                )}

                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold text-text-primary">{plan.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">{plan.highlight}</p>
                  </div>
                  {plan.featured && (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-xl">verified</span>
                    </span>
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black tracking-[-0.05em] text-text-primary">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="pb-2 text-sm font-medium text-text-secondary">/month</span>
                  )}
                </div>

                <p className="mt-5 min-h-[72px] text-sm leading-6 text-text-secondary">{plan.description}</p>

                <Link
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    void makePaymentLink(plan.name);
                  }}
                  className={`mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                    plan.featured
                      ? "bg-primary text-white shadow-lg shadow-emerald-500/25 hover:translate-y-[-1px] hover:bg-primary/90"
                      : "bg-surface-variant text-text-primary hover:bg-surface-container"
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-7 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="mt-20 rounded-[28px] border border-surface-container bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)] md:p-8">
            <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Compare plans</p>
                <h2 className="mt-2 text-2xl font-bold text-text-primary md:text-3xl">
                  Everything you need at every stage.
                </h2>
              </div>
              <p className="max-w-xl text-sm text-text-secondary">
                From a lightweight personal workspace to advanced team-level operations, the right plan scales with your workflow.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                      Feature
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                      Free
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                      Pro
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                      Premium
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.label} className="rounded-2xl bg-surface-variant/60">
                      <td className="rounded-l-2xl px-4 py-4 font-medium text-text-primary">{row.label}</td>
                      {row.values.map((value, index) => (
                        <td
                          key={`${row.label}-${index}-${value}`}
                          className={`px-4 py-4 text-sm text-text-secondary ${
                            index === row.values.length - 1 ? "rounded-r-2xl" : ""
                          }`}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-20 grid gap-6 md:grid-cols-3">
            {benefitCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[24px] border border-surface-container bg-white p-6"
              >
                <span className="material-symbols-outlined text-3xl text-primary">{card.icon}</span>
                <h3 className="mt-4 text-lg font-bold text-text-primary">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{card.description}</p>
              </div>
            ))}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
