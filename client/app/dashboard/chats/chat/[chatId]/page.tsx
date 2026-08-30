"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserProfile, getChatById, getRepositoryById, createChat } from "@/lib/api";
import { User, Repo, Chat, ApiItem, PageItem } from "@/types";
import Image from "next/image";

type TabType = "chat" | "apis" | "pages" | "code";

interface TabItem {
  id: TabType;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { id: "chat", label: "Chat", icon: "chat_bubble" },
  { id: "apis", label: "APIs", icon: "api" },
  { id: "pages", label: "Pages", icon: "description" },
  { id: "code", label: "Code", icon: "code" },
];

export default function ChatWorkspacePage() {
  const router = useRouter();
  const { chatId } = useParams();

  const [user, setUser] = useState<User | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("chat");

  // Filters for APIs & Pages
  const [apiSearch, setApiSearch] = useState("");
  const [apiMethodFilter, setApiMethodFilter] = useState<string>("ALL");
  const [pageSearch, setPageSearch] = useState("");

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
      } catch {
        if (isMounted) {
          setUser(null);
          router.replace("/login");
          return;
        }
      } finally {
        if (isMounted) setIsLoadingAuth(false);
      }

      // Load specific chat details if chatId is present
      if (chatId) {
        try {
          const chatData = await getChatById(chatId as string);
          if (isMounted && chatData) {
            setChat(chatData);

            // Fetch repository details, analysis (apis/pages), and sibling chats
            if (chatData.repoId) {
              const repoData = await getRepositoryById(chatData.repoId);
              if (isMounted && repoData) {
                setRepo(repoData);
                if (Array.isArray(repoData.chats)) {
                  setChats(repoData.chats);
                }
              }
            }
          }
        } catch {
          // Fallback or handle not found
        }
      }

      if (isMounted) {
        setIsLoadingData(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [chatId, router]);

  const handleCreateNewChat = async () => {
    if (!chat?.repoId || isCreatingChat) return;
    setIsCreatingChat(true);
    try {
      const newChat = await createChat({
        repoId: chat.repoId,
        title: "New Discussion",
      });
      if (newChat && newChat.id) {
        router.push(`/dashboard/chats/chat/${newChat.id}`);
      }
    } catch {
      // Fallback
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Extracted APIs list from repo analysis
  const apis: ApiItem[] = useMemo(() => {
    if (repo?.analysis?.apis && Array.isArray(repo.analysis.apis)) {
      return repo.analysis.apis;
    }
    return [];
  }, [repo]);

  // Extracted Pages list from repo analysis
  const pages: PageItem[] = useMemo(() => {
    if (repo?.analysis?.pages && Array.isArray(repo.analysis.pages)) {
      return repo.analysis.pages;
    }
    return [];
  }, [repo]);

  // Filtered APIs based on search and method
  const filteredApis = useMemo(() => {
    return apis.filter((api) => {
      const matchesMethod =
        apiMethodFilter === "ALL" ||
        api.method?.toUpperCase() === apiMethodFilter.toUpperCase();
      const query = apiSearch.toLowerCase().trim();
      const matchesQuery =
        !query ||
        api.endpoint?.toLowerCase().includes(query) ||
        api.description?.toLowerCase().includes(query) ||
        api.file?.toLowerCase().includes(query);
      return matchesMethod && matchesQuery;
    });
  }, [apis, apiSearch, apiMethodFilter]);

  // Filtered Pages based on search
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const query = pageSearch.toLowerCase().trim();
      return (
        !query ||
        page.route?.toLowerCase().includes(query) ||
        page.description?.toLowerCase().includes(query) ||
        page.file?.toLowerCase().includes(query)
      );
    });
  }, [pages, pageSearch]);

  const getMethodBadgeStyle = (method: string) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "POST":
        return "bg-sky-500/15 text-sky-400 border-sky-500/30";
      case "PUT":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "PATCH":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "DELETE":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0b1326] text-[#dae2fd]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-[#94a3b8]">Initializing workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Actual chats from API (or active chat if single session loaded)
  const displayChats = chats.length > 0 ? chats : chat ? [chat] : [];

  return (
    <div className="h-screen w-full flex bg-[#0b1326] text-[#dae2fd] overflow-hidden font-sans">
      {/* ───────────────────────────────────────────────────────────
          1. LEFT SECTION (Sidebar)
          ─────────────────────────────────────────────────────────── */}
      <aside className="w-64 md:w-72 shrink-0 bg-[#0e121e] border-r border-white/[0.08] flex flex-col justify-between h-full p-4 select-none">
        {/* Top Section */}
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="w-9 h-9 rounded-full bg-[#5b5bd6] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-md shrink-0">
              <Image src="/docflowtransparent.png" alt="DocFlow" width={24} height={24} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white tracking-tight">DocFlow AI</span>
            </div>
          </div>

          {/* New Analysis / New Chat Action Button */}
          <button
            type="button"
            onClick={handleCreateNewChat}
            disabled={isCreatingChat}
            className="w-full mt-5 bg-[#e2e8f0] hover:bg-white text-[#0f172a] font-mono font-medium text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>{isCreatingChat ? "Creating..." : "New Analysis"}</span>
          </button>

          {/* Recent Chats Section */}
          <div className="mt-7">
            <h2 className="text-[11px] font-mono tracking-wider text-[#64748b] uppercase px-1 mb-2">
              Recent Chats
            </h2>

            <nav className="flex flex-col gap-1 mt-1">
              {displayChats.length > 0 ? (
                displayChats.map((c) => {
                  const isCurrentChat = c.id === chatId;
                  const titleText = c.title || "Untitled Discussion";

                  return (
                    <Link
                      key={c.id}
                      href={`/dashboard/chats/chat/${c.id}`}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all group ${
                        isCurrentChat
                          ? "bg-white/[0.08] text-white font-medium border border-white/[0.06]"
                          : "text-[#94a3b8] hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[16px] shrink-0 transition-colors ${
                          isCurrentChat
                            ? "text-[#4edea3]"
                            : "text-[#64748b] group-hover:text-[#4edea3]"
                        }`}
                      >
                        chat_bubble_outline
                      </span>
                      <span className="truncate">{titleText}</span>
                    </Link>
                  );
                })
              ) : (
                <div className="px-2.5 py-3 text-[11px] font-mono text-[#64748b] italic">
                  No chats yet
                </div>
              )}
            </nav>
          </div>
        </div>

        {/* Bottom Section (Settings & Support) */}
        <div className="flex flex-col pt-3 border-t border-white/[0.08]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#94a3b8] hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <span className="material-symbols-outlined text-[17px] text-[#64748b]">
              settings
            </span>
            <span>Settings</span>
          </Link>

          <Link
            href="mailto:support@docflow.ai"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#94a3b8] hover:text-white hover:bg-white/[0.04] transition-all mt-0.5"
          >
            <span className="material-symbols-outlined text-[17px] text-[#64748b]">
              help
            </span>
            <span>Support</span>
          </Link>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────
          2. RIGHT SECTION (Workspace & Tabs)
          ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0b1326]">
        {/* Top Tab Navigation Bar */}
        <header className="h-14 shrink-0 bg-[#0e121e] border-b border-white/[0.08] px-6 flex items-center justify-between">
          {/* 4 Tabs: [chat, apis, pages, code] */}
          <div className="flex items-center gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count =
                tab.id === "apis"
                  ? apis.length
                  : tab.id === "pages"
                  ? pages.length
                  : null;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#131b2e] text-[#4edea3] border border-white/[0.12] shadow-sm"
                      : "text-[#94a3b8] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {count !== null && count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-[#dae2fd]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Context / Chat Info */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#64748b]">
            {chat?.title && (
              <span className="text-[#dae2fd] max-w-[200px] truncate">
                {chat.title}
              </span>
            )}
            {chat?.repo && (
              <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[11px] text-[#4edea3]">
                {chat.repo.name}
              </span>
            )}
          </div>
        </header>

        {/* Tab Content Container */}
        <section className="flex-1 overflow-y-auto p-6 flex flex-col">
          {/* ── CHAT TAB ── */}
          {activeTab === "chat" && (
            <div
              id="tab-content-chat"
              className="flex-1 flex flex-col justify-center items-center rounded-xl border border-white/[0.06] border-dashed p-8 bg-[#131b2e]/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#131b2e] border border-white/[0.08] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[#4edea3] text-2xl">
                  chat_bubble
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white font-mono">Chat Tab</h3>
              <p className="text-xs text-[#64748b] mt-1 font-mono text-center max-w-sm">
                Chat conversation and messages container placeholder.
              </p>
            </div>
          )}

          {/* ── APIS TAB ── */}
          {activeTab === "apis" && (
            <div id="tab-content-apis" className="flex-1 flex flex-col">
              {/* Header Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4cd7f6] text-xl">
                      api
                    </span>
                    <span>Backend API Endpoints</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-[#94a3b8]">
                      {apis.length} total
                    </span>
                  </h2>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Discovered controllers, route handlers, and API endpoints from codebase analysis.
                  </p>
                </div>

                {/* Filter controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search input */}
                  <div className="bg-[#131b2e] border border-white/[0.08] rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
                    <span className="material-symbols-outlined text-sm text-[#64748b]">
                      search
                    </span>
                    <input
                      type="text"
                      value={apiSearch}
                      onChange={(e) => setApiSearch(e.target.value)}
                      placeholder="Filter endpoints, files..."
                      className="bg-transparent text-white placeholder-[#64748b] outline-none font-mono text-xs w-40 sm:w-52"
                    />
                    {apiSearch && (
                      <button
                        onClick={() => setApiSearch("")}
                        className="text-[#64748b] hover:text-white"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    )}
                  </div>

                  {/* Method Pills */}
                  <div className="flex items-center bg-[#131b2e] border border-white/[0.08] rounded-lg p-1 gap-1 text-[11px] font-mono">
                    {["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setApiMethodFilter(m)}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                          apiMethodFilter === m
                            ? "bg-white/[0.12] text-white font-bold shadow-xs"
                            : "text-[#64748b] hover:text-[#dae2fd]"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Endpoints List / Empty state */}
              {repo?.status === "ANALYZING" || repo?.status === "PENDING" ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl bg-[#131b2e]/30 border border-white/[0.06] border-dashed">
                  <div className="w-10 h-10 border-2 border-[#4cd7f6] border-t-transparent rounded-full animate-spin mb-4" />
                  <h3 className="text-sm font-semibold text-white font-mono">
                    Codebase Analysis in Progress
                  </h3>
                  <p className="text-xs text-[#94a3b8] mt-1 max-w-sm font-mono">
                    API endpoints are currently being extracted and indexed from this repository.
                  </p>
                </div>
              ) : apis.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl bg-[#131b2e]/30 border border-white/[0.06] border-dashed">
                  <span className="material-symbols-outlined text-4xl text-[#64748b] mb-3">
                    hub
                  </span>
                  <h3 className="text-sm font-semibold text-white font-mono">
                    No API Endpoints Detected
                  </h3>
                  <p className="text-xs text-[#64748b] mt-1 max-w-sm">
                    No REST or controller routes were identified during the structural analysis.
                  </p>
                </div>
              ) : filteredApis.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[#131b2e]/20 border border-white/[0.06] text-xs font-mono text-[#94a3b8]">
                  No API endpoints matching &quot;{apiSearch}&quot; ({apiMethodFilter})
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredApis.map((api, idx) => (
                    <div
                      key={idx}
                      className="bg-[#131b2e]/70 hover:bg-[#131b2e] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-4 transition-all flex flex-col gap-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold tracking-wider border ${getMethodBadgeStyle(
                              api.method
                            )}`}
                          >
                            {api.method}
                          </span>
                          <span className="font-mono text-sm font-semibold text-white tracking-wide break-all">
                            {api.endpoint}
                          </span>
                        </div>

                        {api.file && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748b] bg-[#0b1326] px-2.5 py-1 rounded-md border border-white/[0.06] max-w-full truncate">
                            <span className="material-symbols-outlined text-sm text-[#4edea3]">
                              code
                            </span>
                            <span className="truncate">{api.file}</span>
                          </div>
                        )}
                      </div>

                      {api.description && (
                        <p className="text-xs text-[#94a3b8] leading-relaxed pl-0.5">
                          {api.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PAGES TAB ── */}
          {activeTab === "pages" && (
            <div id="tab-content-pages" className="flex-1 flex flex-col">
              {/* Header Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-xl">
                      description
                    </span>
                    <span>Frontend Pages & Routes</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-[#94a3b8]">
                      {pages.length} total
                    </span>
                  </h2>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Discovered pages, client routes, and layouts identified in the application.
                  </p>
                </div>

                {/* Search input */}
                <div className="bg-[#131b2e] border border-white/[0.08] rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm text-[#64748b]">
                    search
                  </span>
                  <input
                    type="text"
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    placeholder="Filter routes, files..."
                    className="bg-transparent text-white placeholder-[#64748b] outline-none font-mono text-xs w-48 sm:w-64"
                  />
                  {pageSearch && (
                    <button
                      onClick={() => setPageSearch("")}
                      className="text-[#64748b] hover:text-white"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Pages List / Empty state */}
              {repo?.status === "ANALYZING" || repo?.status === "PENDING" ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl bg-[#131b2e]/30 border border-white/[0.06] border-dashed">
                  <div className="w-10 h-10 border-2 border-[#ffb4ab] border-t-transparent rounded-full animate-spin mb-4" />
                  <h3 className="text-sm font-semibold text-white font-mono">
                    Codebase Analysis in Progress
                  </h3>
                  <p className="text-xs text-[#94a3b8] mt-1 max-w-sm font-mono">
                    Frontend routes are currently being indexed from this repository.
                  </p>
                </div>
              ) : pages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl bg-[#131b2e]/30 border border-white/[0.06] border-dashed">
                  <span className="material-symbols-outlined text-4xl text-[#64748b] mb-3">
                    auto_stories
                  </span>
                  <h3 className="text-sm font-semibold text-white font-mono">
                    No Frontend Routes Detected
                  </h3>
                  <p className="text-xs text-[#64748b] mt-1 max-w-sm">
                    No application routes or view pages were found during the structural analysis.
                  </p>
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[#131b2e]/20 border border-white/[0.06] text-xs font-mono text-[#94a3b8]">
                  No pages matching &quot;{pageSearch}&quot;
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredPages.map((page, idx) => (
                    <div
                      key={idx}
                      className="bg-[#131b2e]/70 hover:bg-[#131b2e] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-4 transition-all flex flex-col justify-between gap-3 shadow-sm"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">
                            auto_stories
                          </span>
                          <span className="font-mono text-sm font-bold text-white tracking-wide truncate">
                            {page.route}
                          </span>
                        </div>

                        {page.description && (
                          <p className="text-xs text-[#94a3b8] leading-relaxed">
                            {page.description}
                          </p>
                        )}
                      </div>

                      {page.file && (
                        <div className="pt-2.5 border-t border-white/[0.06] flex items-center gap-1.5 text-[11px] font-mono text-[#64748b] truncate">
                          <span className="material-symbols-outlined text-sm text-[#4edea3]">
                            description
                          </span>
                          <span className="truncate">{page.file}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CODE TAB ── */}
          {activeTab === "code" && (
            <div
              id="tab-content-code"
              className="flex-1 flex flex-col justify-center items-center rounded-xl border border-white/[0.06] border-dashed p-8 bg-[#131b2e]/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#131b2e] border border-white/[0.08] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[#bbcabf] text-2xl">
                  code
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white font-mono">Code Tab</h3>
              <p className="text-xs text-[#64748b] mt-1 font-mono text-center max-w-sm">
                Code explorer and file tree container placeholder.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}