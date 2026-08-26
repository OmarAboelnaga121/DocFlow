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
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0b1326] text-[#dae2fd]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#4edea3] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-[#94a3b8]">Verifying session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0b1326] text-[#dae2fd] relative overflow-hidden">
      {/* Ambient background glows */}
      <div
        className="absolute -top-40 -left-40 w-[30rem] h-[30rem] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: "#4edea3" }}
      />
      <div
        className="absolute top-1/2 -right-40 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full blur-[160px] pointer-events-none opacity-15"
        style={{ background: "#4cd7f6" }}
      />
      <div
        className="absolute -bottom-40 left-1/3 w-[26rem] h-[26rem] rounded-full blur-[140px] pointer-events-none opacity-10"
        style={{ background: "#10b981" }}
      />

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131b2e] border border-white/[0.08] text-xs font-mono text-[#4edea3] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
            STEP 2 OF 2 &bull; WORKSPACE SETUP
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f8fafc] tracking-tight leading-tight mb-2.5">
            How do you plan to use DocFlow?
          </h1>
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            We will tailor your workspace dashboards, tools, and documentation pipelines based on your role.
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div
            className="w-full max-w-2xl p-3.5 mb-6 rounded-lg flex items-center gap-3 text-xs text-[#ffb4ab] border border-[#ffb4ab]/30"
            style={{ background: "rgba(147, 0, 10, 0.25)" }}
          >
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
                  ? "bg-[#131b2e] border-[#4edea3] shadow-[0_0_30px_rgba(78,222,163,0.15)] ring-1 ring-[#4edea3]"
                  : "bg-[#131b2e]/60 border-white/[0.08] hover:border-white/20 hover:bg-[#131b2e]"
              }`}
            >
              {/* Radio Indicator */}
              <div className="absolute top-5 right-5">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selectedRole === "DEVELOPER"
                      ? "border-[#4edea3] bg-[#4edea3]"
                      : "border-white/30 bg-transparent"
                  }`}
                >
                  {selectedRole === "DEVELOPER" && (
                    <span className="material-symbols-outlined text-xs text-[#060e20] font-bold">
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
                      ? "bg-[#4edea3]/15 text-[#4edea3]"
                      : "bg-white/[0.05] text-[#94a3b8]"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    terminal
                  </span>
                </div>

                {/* Role Title */}
                <h3 className="text-xl font-bold text-[#f8fafc] mb-2 flex items-center gap-2">
                  Developer / Engineer
                </h3>

                {/* Role Description */}
                <p className="text-sm text-[#94a3b8] leading-relaxed mb-6">
                  Build and maintain codebases. Connect git repositories, auto-generate AST-driven API docs, and sync documentation with CI/CD.
                </p>
              </div>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.08]">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#060e20] border border-white/[0.06] text-[11px] font-mono text-[#dae2fd]">
                  <i className="fa-brands fa-github text-[#4edea3] text-xs" /> Git Repositories
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#060e20] border border-white/[0.06] text-[11px] font-mono text-[#dae2fd]">
                  <span className="material-symbols-outlined text-xs text-[#4edea3]">api</span> Interactive APIs
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#060e20] border border-white/[0.06] text-[11px] font-mono text-[#dae2fd]">
                  <span className="material-symbols-outlined text-xs text-[#4edea3]">code</span> Code Embeddings
                </span>
              </div>
            </div>

            {/* Business Card */}
            <div
              onClick={() => handleSelectRole("BUSINESS")}
              className={`relative cursor-pointer rounded-xl p-6 transition-all duration-300 flex flex-col justify-between border ${
                selectedRole === "BUSINESS"
                  ? "bg-[#131b2e] border-[#4cd7f6] shadow-[0_0_30px_rgba(76,215,246,0.15)] ring-1 ring-[#4cd7f6]"
                  : "bg-[#131b2e]/60 border-white/[0.08] hover:border-white/20 hover:bg-[#131b2e]"
              }`}
            >
              {/* Radio Indicator */}
              <div className="absolute top-5 right-5">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selectedRole === "BUSINESS"
                      ? "border-[#4cd7f6] bg-[#4cd7f6]"
                      : "border-white/30 bg-transparent"
                  }`}
                >
                  {selectedRole === "BUSINESS" && (
                    <span className="material-symbols-outlined text-xs text-[#060e20] font-bold">
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
                      ? "bg-[#4cd7f6]/15 text-[#4cd7f6]"
                      : "bg-white/[0.05] text-[#94a3b8]"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    business_center
                  </span>
                </div>

                {/* Role Title */}
                <h3 className="text-xl font-bold text-[#f8fafc] mb-2 flex items-center gap-2">
                  Product / Business
                </h3>

                {/* Role Description */}
                <p className="text-sm text-[#94a3b8] leading-relaxed mb-6">
                  Manage projects and understand technical architecture. Access human-readable documentation summaries and track workflow deliverables.
                </p>
              </div>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.08]">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#060e20] border border-white/[0.06] text-[11px] font-mono text-[#dae2fd]">
                  <span className="material-symbols-outlined text-xs text-[#4cd7f6]">insights</span> Project Insights
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#060e20] border border-white/[0.06] text-[11px] font-mono text-[#dae2fd]">
                  <span className="material-symbols-outlined text-xs text-[#4cd7f6]">description</span> Executive Summaries
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#060e20] border border-white/[0.06] text-[11px] font-mono text-[#dae2fd]">
                  <span className="material-symbols-outlined text-xs text-[#4cd7f6]">analytics</span> Workflows
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
              className="w-full h-12 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#10b981]/15"
              style={{
                background: "#10b981",
                color: "#060e20",
              }}
              onMouseEnter={(e) =>
                !isLoading && (e.currentTarget.style.background = "#4edea3")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#10b981")
              }
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#060e20] border-t-transparent rounded-full animate-spin" />
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
        <p className="font-mono text-xs text-[#94a3b8]/70">
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
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0b1326] text-[#dae2fd]">
          <div className="w-8 h-8 border-2 border-[#4edea3] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RoleChoicesContent />
    </Suspense>
  );
}
