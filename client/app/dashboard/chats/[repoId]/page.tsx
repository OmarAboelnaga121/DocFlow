"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserProfile, getRepositoryById, createChat } from "@/lib/api";
import { User, Repo, Chat } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ChatsPage() {
  const router = useRouter();
  const { repoId } = useParams();

  const [user, setUser] = useState<User | null>(null);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingRepo, setIsLoadingRepo] = useState(true);

  // New Chat form state
  const [chatTitle, setChatTitle] = useState("");
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const quickPrompts = [
    "Explain overall architecture",
    "List all API endpoints",
    "How does authentication work?",
    "Generate setup & tech stack docs",
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!repoId) return;

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
        const repoData = await getRepositoryById(repoId as string);
        if (isMounted && repoData) {
          setRepo(repoData);
          if (Array.isArray(repoData.chats)) {
            setChats(repoData.chats);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || "Failed to load repository workspace.");
        }
      } finally {
        if (isMounted) setIsLoadingRepo(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [repoId, router]);

  const handleCreateChat = async (e?: React.FormEvent, customTitle?: string) => {
    if (e) e.preventDefault();
    const titleToUse = (customTitle || chatTitle).trim() || "New Discussion";

    if (!repoId) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCreatingChat(true);

    try {
      const newChat = await createChat({
        repoId: repoId as string,
        title: titleToUse,
      });

      setSuccessMessage(`Session "${titleToUse}" created!`);
      setChatTitle("");

      // Refresh repository/chats
      const updatedRepo = await getRepositoryById(repoId as string);
      if (updatedRepo && Array.isArray(updatedRepo.chats)) {
        setChats(updatedRepo.chats);
      } else if (newChat) {
        setChats((prev) => [newChat, ...prev]);
      }

      if (newChat && newChat.id) {
        router.push(`/dashboard/chats/chat/${newChat.id}`);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to create new chat session. Please try again."
      );
    } finally {
      setIsCreatingChat(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-text-secondary">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 md:px-8 max-w-5xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-0.5">
              arrow_back
            </span>
            <span>Back to Workspaces</span>
          </Link>

          {repo?.url && (
            <Link
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span>View on Git</span>
            </Link>
          )}
        </div>

        {/* Repository Header Banner */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/25 text-primary text-xs font-mono mb-3">
            <span className="material-symbols-outlined text-sm">folder_code</span>
            <span>{repo?.branch || "main"} branch</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            {isLoadingRepo ? "Loading Repository..." : repo?.name || "Repository Workspace"}
          </h1>

          {repo && (
            <div className="flex items-center justify-center gap-3 mt-3 flex-wrap text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">
                  description
                </span>
                {repo.files?.length || 0} Indexed Files
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">
                  chat
                </span>
                {chats.length} Chat Sessions
              </span>
              <span className="text-white/20">•</span>
              <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[11px] font-mono text-on-surface-variant">
                Status: {repo.status}
              </span>
            </div>
          )}
        </div>

        {/* Start New Chat Action Card */}
        <div className="bg-surface-container-low/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 md:p-8 shadow-2xl mb-14 transition-all">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">
                auto_awesome
              </span>
              Start a New AI Conversation
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Ask questions, generate flow diagrams, explore architecture, or debug code in this repository.
            </p>
          </div>

          <form onSubmit={(e) => handleCreateChat(e)} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Chat Title / Query Input */}
              <div className="md:col-span-9 bg-background border border-white/[0.1] focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/30 rounded-xl p-1.5 pl-4 flex items-center gap-3 transition-all">
                <span className="material-symbols-outlined text-text-secondary text-[22px] shrink-0">
                  edit_note
                </span>
                <input
                  type="text"
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  placeholder="Conversation Topic (e.g. Auth Architecture, REST Endpoints, Database Schema...)"
                  className="w-full bg-transparent text-sm text-text-primary placeholder-[#64748b] outline-none font-sans"
                  disabled={isCreatingChat}
                />
              </div>

              {/* Action Button */}
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={isCreatingChat || isLoadingRepo}
                  className="w-full bg-primary-container hover:bg-primary text-surface-container-lowest font-semibold text-sm h-full min-h-[44px] px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-primary/35 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCreatingChat ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-surface-container-lowest border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">add_comment</span>
                      <span>Start Chat</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Starter Prompts */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-text-secondary">Suggested topics:</span>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setChatTitle(prompt);
                  }}
                  className="text-[11px] text-text-secondary hover:text-primary bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </form>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mt-3 p-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-3 p-3 rounded-lg bg-primary-container/15 border border-primary/30 text-primary text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Chat Sessions List Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
              <span>Chat Sessions</span>
              {chats.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] text-text-secondary font-mono font-normal">
                  {chats.length}
                </span>
              )}
            </h2>
          </div>

          {/* Chat Sessions Grid / Empty State */}
          {isLoadingRepo ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl bg-surface-container-low/60 border border-white/[0.06] animate-pulse"
                />
              ))}
            </div>
          ) : chats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/dashboard/chats/chat/${chat.id}`}
                  className="relative bg-surface-container-low border border-white/[0.08] hover:border-primary/50 hover:bg-surface-variant rounded-xl p-5 transition-all flex flex-col justify-between group shadow-lg cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-white truncate text-base group-hover:text-primary transition-colors">
                        {chat.title || "Untitled Session"}
                      </h3>
                      <span className="material-symbols-outlined text-text-secondary group-hover:text-primary text-lg transition-colors shrink-0">
                        chat_bubble_outline
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                      {chat.messages && chat.messages.length > 0
                        ? chat.messages[0].content
                        : "Ready for your questions regarding the codebase..."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-text-secondary">
                    <span className="font-mono text-[11px]">
                      {new Date(chat.updatedAt || chat.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-primary font-medium text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Open Chat
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Clean Empty State */
            <div className="bg-surface-container-low/40 border border-white/[0.06] border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-text-secondary mb-2">
                forum
              </span>
              <p className="text-sm font-medium text-on-background">
                No chat sessions yet
              </p>
              <p className="text-xs text-text-secondary mt-1 max-w-sm">
                Type a conversation topic or select one of the suggested prompts above to start exploring your codebase with AI.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
