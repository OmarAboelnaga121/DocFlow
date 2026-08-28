"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getUserProfile,
  getUserRepositories,
  createRepository,
  deleteRepository,
} from "@/lib/api";
import { User, Repo } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);

  // Form & import states
  const [repoUrl, setRepoUrl] = useState("");
  const [repoName, setRepoName] = useState("");
  const [repoBranch, setRepoBranch] = useState("main");
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Menu & action states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const profile = await getUserProfile();
        if (isMounted && profile && profile.id) {
          setUser(profile);
        } else {
          if (isMounted) {
            setUser(null);
            router.replace("/login");
            return;
          }
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          router.replace("/login");
          return;
        }
      } finally {
        if (isMounted) setIsLoadingAuth(false);
      }

      try {
        const userRepos = await getUserRepositories();
        if (isMounted && Array.isArray(userRepos)) {
          setRepos(userRepos);
        }
      } catch (err) {
        if (isMounted) setRepos([]);
      } finally {
        if (isMounted) setIsLoadingRepos(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Close active dropdown menu when clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };

    window.addEventListener("click", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = repoUrl.trim();
    const cleanName = repoName.trim();
    const cleanBranch = repoBranch.trim() || "main";

    if (!cleanUrl || !cleanName) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsImporting(true);

    try {
      await createRepository({
        url: cleanUrl,
        name: cleanName,
        branch: cleanBranch,
      });

      setSuccessMessage(
        `Repository "${cleanName}" (${cleanBranch}) successfully queued for analysis!`
      );
      setRepoUrl("");
      setRepoName("");
      setRepoBranch("main");

      // Refresh repository list
      const updatedRepos = await getUserRepositories();
      if (Array.isArray(updatedRepos)) {
        setRepos(updatedRepos);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to import repository. Please check the URL and branch."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteRepo = async (id: string, name: string) => {
    setActiveMenuId(null);
    setDeletingId(id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteRepository(id);
      setRepos((prev) => prev.filter((r) => r.id !== id));
      setSuccessMessage(`Repository "${name}" deleted successfully.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete repository.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1326] text-[#dae2fd]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-[#94a3b8]">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1326] text-[#dae2fd]">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 md:px-8 max-w-5xl mx-auto w-full">
        {/* Section Heading */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Analyze & Document Your Codebase
          </h1>
        </div>

        {/* Ingestion Card */}
        <div className="bg-[#131b2e]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 md:p-8 shadow-2xl mb-14 transition-all">
          {/* URL, Name, and Branch Input Form */}
          <form onSubmit={handleImport} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Repository URL */}
              <div className="md:col-span-6 bg-[#0b1326] border border-white/[0.1] focus-within:border-[#4edea3]/70 focus-within:ring-1 focus-within:ring-[#4edea3]/30 rounded-xl p-1.5 pl-4 flex items-center gap-3 transition-all">
                <span className="material-symbols-outlined text-[#94a3b8] text-[22px] shrink-0">
                  link
                </span>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="Repository URL (e.g. https://github.com/org/repo.git)"
                  className="w-full bg-transparent text-sm text-[#f8fafc] placeholder-[#64748b] outline-none font-sans"
                  disabled={isImporting}
                  required
                />
              </div>

              {/* Repository Name */}
              <div className="md:col-span-3 bg-[#0b1326] border border-white/[0.1] focus-within:border-[#4edea3]/70 focus-within:ring-1 focus-within:ring-[#4edea3]/30 rounded-xl p-1.5 pl-3.5 flex items-center gap-2.5 transition-all">
                <span className="material-symbols-outlined text-[#94a3b8] text-[20px] shrink-0">
                  label
                </span>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="Repository Name"
                  className="w-full bg-transparent text-sm text-[#f8fafc] placeholder-[#64748b] outline-none font-sans"
                  disabled={isImporting}
                  required
                />
              </div>

              {/* Branch Name */}
              <div className="md:col-span-3 bg-[#0b1326] border border-white/[0.1] focus-within:border-[#4edea3]/70 focus-within:ring-1 focus-within:ring-[#4edea3]/30 rounded-xl p-1.5 pl-3.5 flex items-center gap-2.5 transition-all">
                <span className="material-symbols-outlined text-[#94a3b8] text-[20px] shrink-0">
                  fork_right
                </span>
                <input
                  type="text"
                  value={repoBranch}
                  onChange={(e) => setRepoBranch(e.target.value)}
                  placeholder="Branch (e.g. main, master)"
                  className="w-full bg-transparent text-sm text-[#f8fafc] placeholder-[#64748b] outline-none font-sans"
                  disabled={isImporting}
                  required
                />
              </div>
            </div>

            {/* Submit Action Row */}
            <div className="flex justify-end mt-1">
              <button
                type="submit"
                disabled={
                  isImporting ||
                  !repoUrl.trim() ||
                  !repoName.trim() ||
                  !repoBranch.trim()
                }
                className="bg-[#10b981] hover:bg-[#4edea3] text-[#060e20] font-semibold text-sm px-7 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-[0_0_20px_rgba(78,222,163,0.35)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                {isImporting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-[#060e20] border-t-transparent rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">cloud_download</span>
                    <span>Import</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mt-3 p-3 rounded-lg bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-3 p-3 rounded-lg bg-[#10b981]/15 border border-[#4edea3]/30 text-[#4edea3] text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Recent Workspaces Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#f8fafc] tracking-tight">
              Recent Workspaces
            </h2>
          </div>

          {/* Workspaces List / Empty State */}
          {isLoadingRepos ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl bg-[#131b2e]/60 border border-white/[0.06] animate-pulse"
                />
              ))}
            </div>
          ) : repos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => router.push(`/dashboard/chats/${repo.id}`)}
                  className="relative bg-[#131b2e] border border-white/[0.08] hover:border-[#4edea3]/50 hover:bg-[#162138] rounded-xl p-5 transition-all flex flex-col justify-between group shadow-lg cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-white truncate text-base group-hover:text-[#4edea3] transition-colors">
                      {repo.name}
                    </h3>

                    {/* Options Menu Button & Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(
                            activeMenuId === repo.id ? null : repo.id
                          );
                        }}
                        className="p-1 rounded-md text-[#64748b] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center justify-center"
                        aria-label="Workspace Options"
                      >
                        <span className="material-symbols-outlined text-lg leading-none">
                          more_vert
                        </span>
                      </button>

                      {/* Dropdown Popup */}
                      {activeMenuId === repo.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 z-30 w-36 py-1 rounded-lg bg-[#171f33] border border-white/[0.12] shadow-2xl backdrop-blur-md animate-fade-in-up"
                        >
                          <button
                            type="button"
                            disabled={deletingId === repo.id}
                            onClick={() =>
                              handleDeleteRepo(repo.id, repo.name)
                            }
                            className="w-full px-3 py-2 text-xs text-left text-[#ffb4ab] hover:bg-[#93000a]/30 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 font-medium"
                          >
                            <span className="material-symbols-outlined text-base text-[#ffb4ab]">
                              delete
                            </span>
                            <span>
                              {deletingId === repo.id
                                ? "Deleting..."
                                : "Delete"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-[#94a3b8] mb-4">
                    {repo.status === "ANALYZING" || repo.status === "EMBEDDING" || repo.status === "CLONING" ? (
                      <span className="text-[#4cd7f6] flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse" />
                        Indexing in progress...
                      </span>
                    ) : (
                      <span>
                        Last updated{" "}
                        {new Date(repo.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[11px] font-mono text-[#bbcabf] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">
                        fork_right
                      </span>
                      {repo.branch || "main"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#10b981]/10 border border-[#10b981]/30 text-[11px] font-mono text-[#4edea3]">
                      {repo.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Clean Empty State (no dummy data) */
            <div className="bg-[#131b2e]/40 border border-white/[0.06] border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-[#64748b] mb-2">
                folder_open
              </span>
              <p className="text-sm font-medium text-[#dae2fd]">
                No workspaces yet
              </p>
              <p className="text-xs text-[#64748b] mt-1 max-w-sm">
                Paste a repository URL above to create and analyze your first
                workspace.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
