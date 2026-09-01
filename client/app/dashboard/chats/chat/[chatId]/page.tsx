"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getUserProfile,
  getChatById,
  getRepositoryById,
  createChat,
  sendMessage,
} from "@/lib/api";
import { User, Repo, Chat, ChatMessage, ApiItem, PageItem } from "@/types";
import Image from "next/image";
import FormattedMessage from "@/components/FormattedMessage";

type TabType = "chat" | "apis" | "pages";

interface TabItem {
  id: TabType;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { id: "chat", label: "Chat", icon: "chat_bubble" },
  { id: "apis", label: "APIs", icon: "api" },
  { id: "pages", label: "Pages", icon: "description" },
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

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filters for APIs & Pages
  const [apiSearch, setApiSearch] = useState("");
  const [apiMethodFilter, setApiMethodFilter] = useState<string>("ALL");
  const [pageSearch, setPageSearch] = useState("");

  const starterPrompts = [
    "Explain overall architecture and stack",
    "List all API endpoints and models",
    "How does authentication and authorization work?",
    "Generate summary documentation of key modules",
  ];

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
            if (Array.isArray(chatData.messages)) {
              setMessages(chatData.messages);
            }

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

  // Scroll to bottom whenever new messages arrive
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending, activeTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || !chatId || isSending) return;

    setSendError(null);
    setInputMessage("");

    // Optimistic User Message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatId: chatId as string,
      role: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const aiResponse = await sendMessage(chatId as string, text);
      if (aiResponse) {
        setMessages((prev) => [...prev, aiResponse]);
      }
    } catch (err: any) {
      setSendError(err.message || "Failed to get AI response. Please try again.");
    } finally {
      setIsSending(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const toggleCitation = (msgId: string) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
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
      <div className="h-screen w-full flex items-center justify-center bg-background text-on-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-text-secondary">Initializing workspace...</span>
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
    <div className="h-screen w-full flex bg-background text-on-background overflow-hidden font-sans">
      {/* ───────────────────────────────────────────────────────────
          1. LEFT SECTION (Sidebar)
          ─────────────────────────────────────────────────────────── */}
      <aside className="w-64 md:w-72 shrink-0 bg-surface-container-lowest border-r border-white/[0.08] flex flex-col h-full select-none overflow-hidden">
        {/* Top Fixed Section */}
        <div className="p-4 pb-2 shrink-0 flex flex-col">
          {/* Brand Header */}
          <Link
            href="/dashboard"
            className="inline-flex items-center px-1 py-1 hover:opacity-80 transition-opacity"
          >
            <span className="text-lg font-bold text-primary tracking-tight font-sans">
              DocFlow
            </span>
          </Link>

          {/* New Analysis / New Chat Action Button */}
          <button
            type="button"
            onClick={() => {
              router.push(`/dashboard/chats/${chat?.repoId}`);
            }}
            className="w-full mt-3 bg-text-primary hover:bg-white text-surface-container-lowest font-mono font-medium text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>New Chat</span>
          </button>
        </div>

        {/* Scrollable Middle Section (Recent Chats) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <h2 className="text-[11px] font-mono tracking-wider text-text-secondary uppercase px-1 mb-2 sticky top-0 bg-surface-container-lowest/95 backdrop-blur-xs py-0.5 z-10">
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
                        : "text-text-secondary hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] shrink-0 transition-colors ${
                        isCurrentChat
                          ? "text-primary"
                          : "text-text-secondary group-hover:text-primary"
                      }`}
                    >
                      chat_bubble_outline
                    </span>
                    <span className="truncate">{titleText}</span>
                  </Link>
                );
              })
            ) : (
              <div className="px-2.5 py-3 text-[11px] font-mono text-text-secondary italic">
                No chats yet
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Fixed Section (Settings & Support) */}
        <div className="p-4 pt-3 border-t border-white/[0.08] shrink-0 flex flex-col bg-surface-container-lowest">
          <Link
            href="/dashboard/user"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-text-secondary hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <span className="material-symbols-outlined text-[17px] text-text-secondary">
              settings
            </span>
            <span>Settings</span>
          </Link>

          <Link
            href="mailto:support@docflow.ai"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-text-secondary hover:text-white hover:bg-white/[0.04] transition-all mt-0.5"
          >
            <span className="material-symbols-outlined text-[17px] text-text-secondary">
              help
            </span>
            <span>Support</span>
          </Link>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────
          2. RIGHT SECTION (Workspace & Tabs)
          ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Top Tab Navigation Bar */}
        <header className="h-14 shrink-0 bg-surface-container-lowest border-b border-white/[0.08] px-6 flex items-center justify-between">
          {/* 3 Tabs: [chat, apis, pages] */}
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
                      ? "bg-surface-container-low text-primary border border-white/[0.12] shadow-sm"
                      : "text-text-secondary hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {count !== null && count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-on-background">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Context / Chat Info */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-text-secondary">
            {chat?.title && (
              <span className="text-on-background max-w-[200px] truncate">
                {chat.title}
              </span>
            )}
            {chat?.repo && (
              <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[11px] text-primary">
                {chat.repo.name}
              </span>
            )}
          </div>
        </header>

        {/* Tab Content Container */}
        <section className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* ── CHAT TAB ── */}
          {activeTab === "chat" && (
            <div id="tab-content-chat" className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
              {/* Messages Stream */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.length === 0 ? (
                  /* Welcome & Starter Prompts */
                  <div className="min-h-full flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-primary-container/15 border border-primary-container/25 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-primary text-2xl">
                        auto_awesome
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Chat with {repo?.name || "Codebase"}
                    </h2>
                    <p className="text-xs text-text-secondary mt-1.5 max-w-md leading-relaxed">
                      Ask questions, analyze REST endpoints, trace architecture, or examine system components with AI grounded in your repository.
                    </p>

                    {/* Starter Suggested Prompts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full">
                      {starterPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="text-left text-xs text-on-background bg-surface-container-low/80 hover:bg-surface-variant border border-white/[0.08] hover:border-primary/40 rounded-xl p-3.5 transition-all shadow-sm cursor-pointer group"
                        >
                          <span className="flex items-center gap-1.5 font-mono text-[11px] text-primary mb-1">
                            <span className="material-symbols-outlined text-sm">bolt</span>
                            Prompt
                          </span>
                          <span className="line-clamp-2 leading-relaxed text-text-secondary group-hover:text-white transition-colors">
                            {prompt}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Message Bubbles */
                  messages.map((msg, idx) => {
                    const isUser = msg.role === "USER";
                    const isExpanded = !!expandedCitations[msg.id];
                    const citations = Array.isArray(msg.context) ? msg.context : [];

                    return (
                      <div
                        key={`msg-${msg.id || idx}-${idx}`}
                        className={`flex gap-3 max-w-4xl ${
                          isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                            isUser
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-primary-container/20 text-primary border border-primary-container/30"
                          }`}
                        >
                          {isUser ? (
                            <span className="material-symbols-outlined text-base">person</span>
                          ) : (
                            <span className="material-symbols-outlined text-base">smart_toy</span>
                          )}
                        </div>

                        {/* Content Box */}
                        <div
                          className={`flex flex-col gap-2 max-w-[85%] md:max-w-[78%] rounded-2xl p-4 text-xs shadow-sm ${
                            isUser
                              ? "bg-surface text-text-primary border border-white/[0.08] rounded-tr-xs"
                              : "bg-surface-container-low text-on-background border border-white/[0.08] rounded-tl-xs"
                          }`}
                        >
                          {/* Role Tag & Timestamp */}
                          <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-text-secondary pb-1 border-b border-white/[0.04]">
                            <span className="font-semibold text-text-secondary">
                              {isUser ? "You" : "DocFlow AI"}
                            </span>
                            <span>
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>

                          {/* Message Body with Rich Markdown & Tables */}
                          <div className="text-xs leading-relaxed text-on-background">
                            <FormattedMessage content={msg.content} />
                          </div>

                          {/* Citations / Retrieved Context Accordion */}
                          {!isUser && citations.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white/[0.06]">
                              <button
                                type="button"
                                onClick={() => toggleCitation(msg.id)}
                                className="flex items-center gap-1.5 text-[11px] font-mono text-secondary hover:text-primary transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {isExpanded ? "expand_less" : "expand_more"}
                                </span>
                                <span>
                                  {citations.length} Source Context{" "}
                                  {citations.length === 1 ? "Chunk" : "Chunks"}
                                </span>
                              </button>

                              {isExpanded && (
                                <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                                  {citations.map((chunk: any, cIdx: number) => (
                                    <div
                                      key={cIdx}
                                      className="p-2.5 rounded-lg bg-surface-container-lowest border border-white/[0.08] text-[11px] font-mono"
                                    >
                                      <div className="flex items-center justify-between text-primary mb-1.5">
                                        <span className="truncate">
                                          {chunk.filePath || chunk.file?.path || "Source File"}
                                        </span>
                                        {chunk.startLine && (
                                          <span className="text-[10px] text-text-secondary">
                                            L{chunk.startLine}-{chunk.endLine}
                                          </span>
                                        )}
                                      </div>
                                      <pre className="text-text-secondary text-[10px] overflow-x-auto whitespace-pre-wrap leading-tight max-h-24">
                                        {chunk.content}
                                      </pre>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* AI Thinking / Streaming Indicator */}
                {isSending && (
                  <div className="flex gap-3 mr-auto max-w-4xl animate-fade-in">
                    <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold bg-primary-container/20 text-primary border border-primary-container/30">
                      <span className="material-symbols-outlined text-base">smart_toy</span>
                    </div>

                    <div className="bg-surface-container-low border border-white/[0.08] rounded-2xl rounded-tl-xs p-4 flex items-center gap-3 text-xs text-text-secondary font-mono">
                      <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing repository context and reasoning...</span>
                    </div>
                  </div>
                )}

                {/* Send Error Toast */}
                {sendError && (
                  <div className="p-3 rounded-xl bg-error-container/30 border border-error/30 text-error text-xs flex items-center justify-between gap-2 max-w-4xl mx-auto">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{sendError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSendError(null)}
                      className="text-error hover:text-white"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Box (Sticky at bottom) */}
              <div className="p-4 bg-surface-container-lowest border-t border-white/[0.08] shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="max-w-4xl mx-auto flex flex-col gap-2"
                >
                  <div className="bg-surface-container-low border border-white/[0.1] focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/30 rounded-xl p-2 flex items-end gap-2 transition-all">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => {
                        setInputMessage(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Ask about ${repo?.name || "architecture, routes, logic..."} (Enter to send, Shift+Enter for new line)`}
                      rows={1}
                      disabled={isSending}
                      className="w-full bg-transparent text-xs text-text-primary placeholder-[#64748b] outline-none font-sans resize-none py-1 px-2 max-h-36 leading-relaxed"
                    />

                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isSending}
                      className="shrink-0 bg-primary-container hover:bg-primary text-surface-container-lowest disabled:opacity-30 disabled:cursor-not-allowed w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">send</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary px-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                      RAG Vector Search Active
                    </span>
                    <span>{repo?.branch ? `Branch: ${repo.branch}` : ""}</span>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── APIS TAB ── */}
          {activeTab === "apis" && (
            <div id="tab-content-apis" className="flex-1 min-h-0 flex flex-col overflow-y-auto p-6">
              {/* Header Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-xl">
                      api
                    </span>
                    <span>Backend API Endpoints</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-text-secondary">
                      {apis.length} total
                    </span>
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Discovered controllers, route handlers, and API endpoints from codebase analysis.
                  </p>
                </div>

                {/* Filter controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search input */}
                  <div className="bg-surface-container-low border border-white/[0.08] rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
                    <span className="material-symbols-outlined text-sm text-text-secondary">
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
                        className="text-text-secondary hover:text-white"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    )}
                  </div>

                  {/* Method Pills */}
                  <div className="flex items-center bg-surface-container-low border border-white/[0.08] rounded-lg p-1 gap-1 text-[11px] font-mono">
                    {["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setApiMethodFilter(m)}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                          apiMethodFilter === m
                            ? "bg-white/[0.12] text-white font-bold shadow-xs"
                            : "text-text-secondary hover:text-on-background"
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
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl bg-surface-container-low/30 border border-white/[0.06] border-dashed">
                  <div className="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
                  <h3 className="text-sm font-semibold text-white font-mono">
                    Codebase Analysis in Progress
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm font-mono">
                    API endpoints are currently being extracted and indexed from this repository.
                  </p>
                </div>
              ) : apis.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl bg-surface-container-low/30 border border-white/[0.06] border-dashed">
                  <span className="material-symbols-outlined text-4xl text-text-secondary mb-3">
                    hub
                  </span>
                  <h3 className="text-sm font-semibold text-white font-mono">
                    No API Endpoints Detected
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm">
                    No REST or controller routes were identified during the structural analysis.
                  </p>
                </div>
              ) : filteredApis.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-surface-container-low/20 border border-white/[0.06] text-xs font-mono text-text-secondary">
                  No API endpoints matching &quot;{apiSearch}&quot; ({apiMethodFilter})
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredApis.map((api, idx) => (
                    <div
                      key={idx}
                      className="bg-surface-container-low/70 hover:bg-surface-container-low border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-4 transition-all flex flex-col gap-2.5 shadow-sm"
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
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-secondary bg-background px-2.5 py-1 rounded-md border border-white/[0.06] max-w-full truncate">
                            <span className="material-symbols-outlined text-sm text-primary">
                              code
                            </span>
                            <span className="truncate">{api.file}</span>
                          </div>
                        )}
                      </div>

                      {api.description && (
                        <p className="text-xs text-text-secondary leading-relaxed pl-0.5">
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
            <div id="tab-content-pages" className="flex-1 min-h-0 flex flex-col overflow-y-auto p-6">
              {/* Header Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-error text-xl">
                      description
                    </span>
                    <span>Frontend Pages & Routes</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-text-secondary">
                      {pages.length} total
                    </span>
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Discovered pages, client routes, and layouts identified in the application.
                  </p>
                </div>

                {/* Search input */}
                <div className="bg-surface-container-low border border-white/[0.08] rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm text-text-secondary">
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
                      className="text-text-secondary hover:text-white"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Pages List / Empty state */}
              {repo?.status === "ANALYZING" || repo?.status === "PENDING" ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl bg-surface-container-low/30 border border-white/[0.06] border-dashed">
                  <div className="w-10 h-10 border-2 border-error border-t-transparent rounded-full animate-spin mb-4" />
                  <h3 className="text-sm font-semibold text-white font-mono">
                    Codebase Analysis in Progress
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm font-mono">
                    Frontend routes are currently being indexed from this repository.
                  </p>
                </div>
              ) : pages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl bg-surface-container-low/30 border border-white/[0.06] border-dashed">
                  <span className="material-symbols-outlined text-4xl text-text-secondary mb-3">
                    auto_stories
                  </span>
                  <h3 className="text-sm font-semibold text-white font-mono">
                    No Frontend Routes Detected
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm">
                    No application routes or view pages were found during the structural analysis.
                  </p>
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-surface-container-low/20 border border-white/[0.06] text-xs font-mono text-text-secondary">
                  No pages matching &quot;{pageSearch}&quot;
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredPages.map((page, idx) => (
                    <div
                      key={idx}
                      className="bg-surface-container-low/70 hover:bg-surface-container-low border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-4 transition-all flex flex-col justify-between gap-3 shadow-sm"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-error text-[18px]">
                            auto_stories
                          </span>
                          <span className="font-mono text-sm font-bold text-white tracking-wide truncate">
                            {page.route}
                          </span>
                        </div>

                        {page.description && (
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {page.description}
                          </p>
                        )}
                      </div>

                      {page.file && (
                        <div className="pt-2.5 border-t border-white/[0.06] flex items-center gap-1.5 text-[11px] font-mono text-text-secondary truncate">
                          <span className="material-symbols-outlined text-sm text-primary">
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
        </section>
      </main>
    </div>
  );
}