"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, getUserProfile } from "@/lib/api";

type RoleOption = "DEVELOPER" | "BUSINESS";

function RoleChoicesContent() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<RoleOption>("DEVELOPER");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getUserProfile()
      .then((profile) => {
        if (!isMounted) return;
        if (profile?.id) {
          setUserId(profile.id);
          setIsCheckingAuth(false);
        } else {
          router.replace("/register");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        router.replace("/register");
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSelectRole = (role: RoleOption) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      router.replace("/login");
      return;
    }

    setIsLoading(true);
    try {
      await updateUserRole(userId, selectedRole);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update role. Please try again.";
      setError(message);
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-on-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-text-secondary">Verifying session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-on-background relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] rounded-full blur-[140px] pointer-events-none opacity-20 bg-primary" />
      <div className="absolute top-1/2 -right-40 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full blur-[160px] pointer-events-none opacity-15 bg-secondary" />
      <div className="absolute -bottom-40 left-1/3 w-[26rem] h-[26rem] rounded-full blur-[140px] pointer-events-none opacity-10 bg-primary-container" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 pt-4 sm:pt-6 pb-1 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center -ml-3">
          <Image
            src="/docflowtransparent.png"
            alt="DocFlow Logo"
            width={180}
            height={60}
            className="object-contain"
            priority
          />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-8 pt-1 sm:pt-3 pb-8 flex flex-col items-center flex-1">
        {/* Header Titles */}
        <div className="text-center max-w-2xl mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low border border-white/[0.08] text-xs font-mono text-primary mb-3">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            STEP 2 OF 2 &bull; WORKSPACE SETUP
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight leading-tight mb-2.5">
            How do you plan to use DocFlow?
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            We will tailor your workspace dashboards, tools, and documentation pipelines based on your role.
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="w-full max-w-2xl p-3.5 mb-6 rounded-lg flex items-center gap-3 text-xs text-error border border-error/30 bg-error-container/25">
            <span className="material-symbols-outlined text-lg leading-none shrink-0">
              error
            </span>
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Form & Role Cards */}
        <form onSubmit={handleSubmit} className="w-full max-w-3xl flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full mb-8">
            {/* Developer Card */}
            <div
              onClick={() => handleSelectRole("DEVELOPER")}
              className={`relative cursor-pointer rounded-xl p-6 transition-all duration-300 flex flex-col justify-between border ${
                selectedRole === "DEVELOPER"
                  ? "bg-surface-container-low border-primary shadow-[0_0_30px_rgba(78,222,163,0.15)] ring-1 ring-primary"
                  : "bg-surface-container-low/60 border-white/[0.08] hover:border-white/20 hover:bg-surface-container-low"
              }`}
            >
              {/* Radio Indicator */}
              <div className="absolute top-5 right-5">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selectedRole === "DEVELOPER"
                      ? "border-primary bg-primary"
                      : "border-white/30 bg-transparent"
                  }`}
                >
                  {selectedRole === "DEVELOPER" && (
                    <span className="material-symbols-outlined text-xs text-surface-container-lowest font-bold">
                      check
                    </span>
                  )}
                </div>
              </div>

              <div>
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 transition-colors ${
                    selectedRole === "DEVELOPER"
                      ? "bg-primary/15 text-primary"
                      : "bg-white/[0.05] text-text-secondary"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    terminal
                  </span>
                </div>

                {/* Role Title */}
                <h3 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
                  Developer / Engineer
                </h3>

                {/* Role Description */}
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  Build and maintain codebases. Connect git repositories, auto-generate AST-driven API docs, and sync documentation with CI/CD.
                </p>
              </div>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.08]">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-lowest border border-white/[0.06] text-[11px] font-mono text-on-background">
                  <i className="fa-brands fa-github text-primary text-xs" /> Git Repositories
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-lowest border border-white/[0.06] text-[11px] font-mono text-on-background">
                  <span className="material-symbols-outlined text-xs text-primary">api</span> Interactive APIs
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-lowest border border-white/[0.06] text-[11px] font-mono text-on-background">
                  <span className="material-symbols-outlined text-xs text-primary">code</span> Code Embeddings
                </span>
              </div>
            </div>

            {/* Business Card */}
            <div
              onClick={() => handleSelectRole("BUSINESS")}
              className={`relative cursor-pointer rounded-xl p-6 transition-all duration-300 flex flex-col justify-between border ${
                selectedRole === "BUSINESS"
                  ? "bg-surface-container-low border-secondary shadow-[0_0_30px_rgba(76,215,246,0.15)] ring-1 ring-secondary"
                  : "bg-surface-container-low/60 border-white/[0.08] hover:border-white/20 hover:bg-surface-container-low"
              }`}
            >
              {/* Radio Indicator */}
              <div className="absolute top-5 right-5">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selectedRole === "BUSINESS"
                      ? "border-secondary bg-secondary"
                      : "border-white/30 bg-transparent"
                  }`}
                >
                  {selectedRole === "BUSINESS" && (
                    <span className="material-symbols-outlined text-xs text-surface-container-lowest font-bold">
                      check
                    </span>
                  )}
                </div>
              </div>

              <div>
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 transition-colors ${
                    selectedRole === "BUSINESS"
                      ? "bg-secondary/15 text-secondary"
                      : "bg-white/[0.05] text-text-secondary"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    business_center
                  </span>
                </div>

                {/* Role Title */}
                <h3 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
                  Product / Business
                </h3>

                {/* Role Description */}
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  Manage projects and understand technical architecture. Access human-readable documentation summaries and track workflow deliverables.
                </p>
              </div>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.08]">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-lowest border border-white/[0.06] text-[11px] font-mono text-on-background">
                  <span className="material-symbols-outlined text-xs text-secondary">insights</span> Project Insights
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-lowest border border-white/[0.06] text-[11px] font-mono text-on-background">
                  <span className="material-symbols-outlined text-xs text-secondary">description</span> Executive Summaries
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-lowest border border-white/[0.06] text-[11px] font-mono text-on-background">
                  <span className="material-symbols-outlined text-xs text-secondary">analytics</span> Workflows
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full max-w-md flex flex-col items-center gap-3">
            <button
              type="submit"
              id="role-submit-btn"
              disabled={isLoading}
              className="w-full h-12 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary-container/15 bg-primary-container text-surface-container-lowest hover:bg-primary"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-surface-container-lowest border-t-transparent rounded-full animate-spin" />
                  <span>Configuring workspace…</span>
                </>
              ) : (
                <>
                  <span>Continue to Workspace</span>
                  <span className="material-symbols-outlined text-lg leading-none">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 pb-8 text-center">
        <p className="font-mono text-xs text-text-secondary/70">
          © {new Date().getFullYear()} DocFlow Inc. You can always change your role in Workspace Settings.
        </p>
      </footer>
    </div>
  );
}

export default function RoleChoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-background text-on-background">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RoleChoicesContent />
    </Suspense>
  );
}
