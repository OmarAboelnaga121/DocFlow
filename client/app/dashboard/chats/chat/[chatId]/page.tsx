"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faBrain,
  faGaugeHigh,
  faSliders,
  faFolder,
  faChevronRight,
  faComments,
  faCode,
  faFileLines,
  faCodeBranch,
  faCircleCheck,
  faDatabase,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  getUserProfile,
  getChatById,
  getRepositoryById,
  createChat,
  sendMessage,
  CHAT_MODELS,
  ChatModel,
} from "@/lib/api";
import { User, Repo, Chat, ChatMessage, ApiItem, PageItem, DatabaseSchema } from "@/types";
import FormattedMessage from "@/components/FormattedMessage";
import UserNavDropdown from "@/components/UserNavDropdown";
import SchemaCanvas from "@/components/SchemaCanvas";

type TabType = "chat" | "apis" | "pages" | "databases";

interface TabItem {
  id: TabType;
  label: string;
  icon: IconDefinition;
}

interface Citation {
  filePath?: string;
  file?: { path?: string };
  startLine?: number;
  endLine?: number;
  content?: string;
}

const TABS: TabItem[] = [
  { id: "chat", label: "Chat", icon: faComments },
  { id: "apis", label: "APIs", icon: faCode },
  { id: "pages", label: "Pages", icon: faFileLines },
  { id: "databases", label: "Databases", icon: faDatabase },
];

const MODEL_ICONS: Record<ChatModel, IconDefinition> = {
  "qwen3.8-max": faBrain,
  "qwen3.8-flash": faBolt,
  "qwen3.7-plus": faGaugeHigh,
  "qwen3.7-flash": faSliders,
};

export default function ChatWorkspacePage() {
  const router = useRouter();
  const { chatId } = useParams();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt")?.trim() || "";

  const [user, setUser] = useState<User | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ChatModel>("qwen3.8-flash");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [agentStatusIndex, setAgentStatusIndex] = useState(0);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sentInitialPromptRef = useRef<string | null>(null);

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
          // If chatId was not a chat session ID, try fetching it as a repository ID for starting a new chat
          try {
            const repoData = await getRepositoryById(chatId as string);
            if (isMounted && repoData) {
              setRepo(repoData);
              setChat(null);
              setMessages([]);
              if (Array.isArray(repoData.chats)) {
                setChats(repoData.chats);
              }
            }
          } catch {
            // Neither chat nor repo found
          }
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

  const agentStatusMessages = [
    { phase: "Thinking", detail: "Reading your request and identifying the relevant repository area..." },
    { phase: "Planning", detail: "Breaking the request into smaller questions to investigate..." },
    { phase: "Searching repository", detail: "Searching files for matching code and references..." },
    { phase: "Inspecting backend", detail: "Checking controllers, services, and routes related to your question..." },
    { phase: "Inspecting data", detail: "Looking for the data models and configuration behind this behavior..." },
    { phase: "Tracing code", detail: "Following how the relevant modules connect across the codebase..." },
    { phase: "Following request flow", detail: "Connecting the frontend request to the backend response..." },
    { phase: "Reviewing context", detail: "Comparing the strongest matches and checking supporting context..." },
    { phase: "Checking edge cases", detail: "Looking for related files and integration details that may affect the answer..." },
    { phase: "Filtering results", detail: "Removing unrelated matches and keeping the useful evidence..." },
    { phase: "Reasoning", detail: "Connecting the implementation details to the repository architecture..." },
    { phase: "Verifying", detail: "Cross-checking the explanation against the code and available references..." },
    { phase: "Drafting answer", detail: "Preparing a concise explanation grounded in the codebase..." },
    { phase: "Finishing", detail: "Organizing the findings into a clear answer..." },
  ];

  useEffect(() => {
    if (!isSending) {
      return;
    }

    const statusTimer = window.setInterval(() => {
      setAgentStatusIndex((currentIndex) =>
        Math.min(currentIndex + 1, agentStatusMessages.length - 1)
      );
    }, 3200);

    return () => window.clearInterval(statusTimer);
  }, [isSending, agentStatusMessages.length]);

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    const currentRepoId = repo?.id || chat?.repoId || (chatId as string);
    if (!text || (!chat && !currentRepoId) || isSending) return;

    setSendError(null);
    setInputMessage("");
    setAgentStatusIndex(0);

    // Optimistic User Message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatId: chat?.id || (chatId as string),
      role: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      let activeChatId = chat?.id;
      let activeChat = chat;

      // If we don't have an active chat session yet, create it on first message dispatch
      if (!activeChatId) {
        const createdChat = await createChat({
          repoId: currentRepoId,
          title: "New Chat",
        });
        activeChatId = createdChat.id;
        activeChat = createdChat;
        setChat(createdChat);
      }

      const aiResponse = await sendMessage(activeChatId, text, selectedModel);
      if (aiResponse) {
        setMessages((prev) => [...prev, aiResponse]);
        const finalTitle = aiResponse.chatTitle || activeChat?.title || "Discussion";

        // Update active chat title in state
        const updatedChat: Chat = {
          ...(activeChat || {}),
          id: activeChatId,
          repoId: currentRepoId,
          title: finalTitle,
        } as Chat;
        setChat(updatedChat);

        // Add or update this chat in the recent chats list with its finalized title
        setChats((prev) => {
          const filtered = prev.filter((c) => c.id !== activeChatId);
          return [{ ...updatedChat, messages: [aiResponse] }, ...filtered];
        });

        // Silently update browser URL if we were on the repoId route
        if (chatId !== activeChatId) {
          window.history.replaceState(null, "", `/dashboard/chats/chat/${activeChatId}`);
        }
      }
    } catch (err) {
      setSendError(
        err instanceof Error
          ? err.message
          : "Failed to get AI response. Please try again."
      );
    } finally {
      setIsSending(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [chat, repo, chatId, inputMessage, isSending, selectedModel]);

  useEffect(() => {
    if (
      !initialPrompt ||
      !chatId ||
      isLoadingData ||
      messages.length > 0 ||
      sentInitialPromptRef.current === initialPrompt
    ) {
      return;
    }

    sentInitialPromptRef.current = initialPrompt;
    window.history.replaceState(null, "", window.location.pathname);
    void handleSendMessage(initialPrompt);
  }, [initialPrompt, chatId, isLoadingData, messages.length, handleSendMessage]);

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

  // Extracted Database Schema from repo
  const databaseSchema: DatabaseSchema | null = useMemo(() => {
    if (repo?.schema && Array.isArray(repo.schema.tables)) {
      return repo.schema;
    }
    return null;
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

  // Filter out unstarted "New Chat" sessions from Recent Chats
  const displayChats = useMemo(() => {
    const list = chats.length > 0 ? chats : chat ? [chat] : [];
    return list.filter((c) => {
      if (c.title === "New Chat" && (!c.messages || c.messages.length === 0)) {
        return false;
      }
      return true;
    });
  }, [chats, chat]);

  const handleNewChat = useCallback(() => {
    const targetRepoId = repo?.id || chat?.repoId;
    if (!targetRepoId) return;
    setIsSidebarOpen(false);
    setChat(null);
    setMessages([]);
    setInputMessage("");
    setSendError(null);
    router.push(`/dashboard/chats/chat/${targetRepoId}`);
  }, [repo?.id, chat?.repoId, router]);

  const activeModel = useMemo(
    () => CHAT_MODELS.find((model) => model.value === selectedModel),
    [selectedModel]
  );

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

  return (
    <div className="h-screen w-full flex bg-background text-on-background overflow-hidden font-sans relative">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ───────────────────────────────────────────────────────────
          1. LEFT SECTION (Sidebar)
          ─────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-72 shrink-0 bg-surface-container-lowest border-r border-border-hairline flex flex-col h-full select-none overflow-hidden shadow-2xl md:shadow-none transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="h-16 shrink-0 flex items-center justify-between gap-2 px-4 border-b border-border-hairline md:border-b-0">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                onClick={() => setIsSidebarOpen(false)}
                className="text-lg font-semibold text-text-primary tracking-tight hover:text-primary transition-colors"
              >
                DocFlow
              </Link>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] font-mono text-text-secondary">
                v2.0
              </span>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container-low transition-colors"
              aria-label="Close sidebar"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* New Chat Action */}
          <div className="px-4 py-3 md:pt-0 md:pb-4">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full bg-primary hover:bg-primary-container text-white font-medium text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-[0.99] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Chat</span>
            </button>
          </div>

          {/* Workspace Navigation */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
            <h2 className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase px-1 mb-2">
              Recent Chats
            </h2>
            <nav className="flex flex-col gap-1">
              {displayChats.length > 0 ? (
                displayChats.map((c) => {
                  const isCurrentChat = c.id === chatId;
                  const titleText = c.title || "Untitled Discussion";

                  return (
                    <Link
                      key={c.id}
                      href={`/dashboard/chats/chat/${c.id}`}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all group ${
                        isCurrentChat
                          ? "bg-surface-container-low text-primary font-medium border border-surface-container"
                          : "text-text-secondary hover:text-on-surface hover:bg-surface-container-low"
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
        </div>

        {/* Bottom Fixed Section (Settings & Support) */}
        <div className="p-4 pt-3 border-t border-border-hairline shrink-0 flex flex-col bg-surface">
          <Link
            href="/dashboard/user"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-text-secondary hover:text-on-surface hover:bg-surface-container-low transition-all"
          >
            <span className="material-symbols-outlined text-[17px] text-text-secondary">
              settings
            </span>
            <span>Settings</span>
          </Link>

          <Link
            href="mailto:support@docflow.ai"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-text-secondary hover:text-on-surface hover:bg-surface-container-low transition-all mt-0.5"
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
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-background">
        {/* Top Header: Breadcrumbs & System Status */}
        <header className="h-13 shrink-0 bg-surface border-b border-border-hairline px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Mobile Menu Toggle & Breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            {/* Hamburger Button (Mobile only) */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-container-low transition-colors shrink-0"
              aria-label="Open sidebar navigation"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-text-secondary hover:text-primary transition-colors shrink-0 group max-w-[110px] sm:max-w-[180px]"
              title="Return to repository discussions"
            >
              <FontAwesomeIcon icon={faFolder} className="text-text-secondary group-hover:text-primary text-xs transition-colors shrink-0" />
              <span className="text-xs font-medium tracking-tight truncate">
                {repo?.name || chat?.repo?.name || "Codebase"}
              </span>
            </Link>

            <FontAwesomeIcon icon={faChevronRight} className="text-[9px] text-text-secondary/40 shrink-0" />

            <span className="text-xs font-semibold text-text-primary truncate max-w-[120px] sm:max-w-[220px]">
              {chat?.title || "Discussion"}
            </span>
          </div>

          {/* Right Action & Status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Active Status Badge */}
            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Cluster: </span>
              <span>Active</span>
            </div>

            {/* User Profile Avatar / Dropdown */}
            {user && <UserNavDropdown user={user} />}
          </div>
        </header>

        {/* Sub-Navigation: Tabs & Repository Info */}
        <div className="h-11 shrink-0 bg-surface border-b border-border-hairline px-3 sm:px-6 flex items-center justify-between gap-2 overflow-hidden">
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 h-full -mb-px overflow-x-auto no-scrollbar scroll-smooth">
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
                  className={`h-full flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-text-secondary hover:text-on-surface hover:border-surface-container-high"
                  }`}
                >
                  <FontAwesomeIcon icon={tab.icon} className="text-[12px] sm:text-[13px]" />
                  <span>{tab.label}</span>
                  {count !== null && count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-container text-text-secondary"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Repository Branch / Spec Meta */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono shrink-0">
            {/* Active Spec / Sync Status */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-text-secondary bg-surface-container-low/60 border border-border-hairline">
              <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500 text-[11px]" />
              <span className="truncate max-w-32 lg:max-w-40 text-text-primary font-medium">
                {repo?.name ? `${repo.name}.spec` : "workspace"}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">• Synced</span>
            </div>

            {/* Git Branch Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-text-secondary bg-surface-container-low/60 border border-border-hairline">
              <FontAwesomeIcon icon={faCodeBranch} className="text-text-secondary text-[11px]" />
              <span className="text-text-primary font-medium truncate max-w-24">
                {repo?.branch || "main"}
              </span>
            </div>
          </div>
        </div>

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

                    <h2 className="text-xl font-bold text-text-primary tracking-tight">
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
                          className="text-left text-xs text-on-background bg-white hover:bg-surface-container-low border border-surface-container hover:border-primary/40 rounded-xl p-3.5 transition-all shadow-xs cursor-pointer group"
                        >
                          <span className="flex items-center gap-1.5 font-mono text-[11px] text-primary mb-1">
                            <span className="material-symbols-outlined text-sm">bolt</span>
                            Prompt
                          </span>
                          <span className="line-clamp-2 leading-relaxed text-text-secondary group-hover:text-on-surface transition-colors">
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
                    const citations: Citation[] = Array.isArray(msg.context)
                      ? msg.context
                      : [];

                    return (
                      <div
                        key={`msg-${msg.id || idx}-${idx}`}
                        className={`flex gap-2.5 sm:gap-3 max-w-4xl ${
                          isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                            isUser
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-primary-container/20 text-primary border border-primary-container/30"
                          }`}
                        >
                          {isUser ? (
                            <span className="material-symbols-outlined text-[15px] sm:text-base">person</span>
                          ) : (
                            <span className="material-symbols-outlined text-[15px] sm:text-base">smart_toy</span>
                          )}
                        </div>

                        {/* Content Box */}
                        <div
                          className={`flex flex-col gap-2 max-w-[88%] sm:max-w-[85%] md:max-w-[78%] rounded-2xl p-3 sm:p-4 text-xs shadow-xs ${
                            isUser
                              ? "bg-primary/10 text-text-primary border border-primary/25 rounded-tr-xs"
                              : "bg-white text-on-background border border-surface-container rounded-tl-xs shadow-xs"
                          }`}
                        >
                          {/* Role Tag & Timestamp */}
                          <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-text-secondary pb-1 border-b border-surface-container">
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
                            <div className="mt-2 pt-2 border-t border-surface-container">
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
                                  {citations.map((chunk, cIdx) => (
                                    <div
                                      key={cIdx}
                                      className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container text-[11px] font-mono"
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

                    <div className="bg-white border border-surface-container rounded-2xl rounded-tl-xs p-4 flex items-start gap-3 text-xs text-text-secondary font-mono shadow-xs">
                      <span className="inline-block w-4 h-4 mt-0.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-semibold text-text-primary">
                          {agentStatusMessages[agentStatusIndex].phase}
                        </span>
                        <span>{agentStatusMessages[agentStatusIndex].detail}</span>
                      </div>
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
                      className="text-error hover:text-text-primary"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Box (Sticky at bottom) */}
              <div className="p-3 sm:p-4 bg-surface border-t border-border-hairline shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="max-w-4xl mx-auto flex flex-col gap-2"
                >
                  <div className="bg-surface-container-low border border-surface-container focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/30 rounded-xl p-2 flex items-end gap-2 transition-all">
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsModelMenuOpen((open) => !open)}
                        disabled={isSending}
                        aria-expanded={isModelMenuOpen}
                        aria-haspopup="listbox"
                        className="h-8 rounded-lg px-1.5 flex items-center gap-1.5 text-[11px] font-mono text-text-secondary hover:text-primary hover:bg-surface-container transition-colors disabled:opacity-40"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                          {activeModel && (
                            <FontAwesomeIcon
                              icon={MODEL_ICONS[activeModel.value]}
                              className="text-[13px]"
                            />
                          )}
                        </span>
                        <span className="hidden sm:inline">
                          {activeModel?.label}
                        </span>
                        <span className="material-symbols-outlined text-sm">
                          {isModelMenuOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                        </span>
                      </button>

                      {isModelMenuOpen && (
                        <div
                          role="listbox"
                          aria-label="Choose AI model"
                          className="absolute bottom-full left-0 z-20 mb-2 w-64 sm:w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-surface-container bg-white p-1.5 shadow-xl"
                        >
                          <div className="px-2.5 py-2 text-[10px] font-mono uppercase tracking-wider text-text-secondary">
                            Choose model
                          </div>
                          {CHAT_MODELS.map((model) => {
                            const isSelected = model.value === selectedModel;

                            return (
                              <button
                                key={model.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setSelectedModel(model.value);
                                  setIsModelMenuOpen(false);
                                }}
                                className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                                  isSelected
                                    ? "bg-primary/10 text-primary"
                                    : "text-text-primary hover:bg-surface-container-low"
                                }`}
                              >
                                <span className="flex items-center gap-2.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                                    <FontAwesomeIcon
                                      icon={MODEL_ICONS[model.value]}
                                      className="text-[14px]"
                                    />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center justify-between gap-2 text-xs font-semibold">
                                      <span>{model.label}</span>
                                      {isSelected && (
                                        <span className="material-symbols-outlined text-sm text-primary">
                                          check
                                        </span>
                                      )}
                                    </span>
                                    <span className="mt-0.5 block text-[10px] text-text-secondary">
                                      {model.description}
                                    </span>
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

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
                      className="w-full bg-transparent text-xs text-text-primary placeholder-[#94a3b8] outline-none font-sans resize-none py-1 px-2 max-h-36 leading-relaxed"
                    />

                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isSending}
                      className="shrink-0 bg-primary-container hover:bg-primary text-white disabled:opacity-30 disabled:cursor-not-allowed w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">send</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[11px] font-mono text-text-secondary px-1">
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
            <div id="tab-content-apis" className="flex-1 min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6">
              {/* Header Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border-hairline mb-6">
                <div>
                  <h2 className="text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-xl">
                      api
                    </span>
                    <span>Backend API Endpoints</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-container text-text-secondary">
                      {apis.length} total
                    </span>
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Discovered controllers, route handlers, and API endpoints from codebase analysis.
                  </p>
                </div>

                {/* Filter controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                  {/* Search input */}
                  <div className="bg-white border border-surface-container rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs shadow-xs w-full sm:w-auto">
                    <span className="material-symbols-outlined text-sm text-text-secondary">
                      search
                    </span>
                    <input
                      type="text"
                      value={apiSearch}
                      onChange={(e) => setApiSearch(e.target.value)}
                      placeholder="Filter endpoints, files..."
                      className="bg-transparent text-text-primary placeholder-[#94a3b8] outline-none font-mono text-xs w-full sm:w-52"
                    />
                    {apiSearch && (
                      <button
                        onClick={() => setApiSearch("")}
                        className="text-text-secondary hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    )}
                  </div>

                  {/* Method Pills */}
                  <div className="flex items-center overflow-x-auto no-scrollbar bg-white border border-surface-container rounded-lg p-1 gap-1 text-[11px] font-mono shadow-xs max-w-full">
                    {["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setApiMethodFilter(m)}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer whitespace-nowrap ${
                          apiMethodFilter === m
                            ? "bg-surface-container-high text-primary font-bold shadow-xs"
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
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl bg-white border border-surface-container border-dashed">
                  <div className="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
                  <h3 className="text-sm font-semibold text-text-primary font-mono">
                    Codebase Analysis in Progress
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm font-mono">
                    API endpoints are currently being extracted and indexed from this repository.
                  </p>
                </div>
              ) : apis.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl bg-white border border-surface-container border-dashed">
                  <span className="material-symbols-outlined text-4xl text-text-secondary mb-3">
                    hub
                  </span>
                  <h3 className="text-sm font-semibold text-text-primary font-mono">
                    No API Endpoints Detected
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm">
                    No REST or controller routes were identified during the structural analysis.
                  </p>
                </div>
              ) : filteredApis.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-surface border border-surface-container text-xs font-mono text-text-secondary">
                  No API endpoints matching &quot;{apiSearch}&quot; ({apiMethodFilter})
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredApis.map((api, idx) => (
                    <div
                      key={idx}
                      className="bg-white hover:bg-surface-container-low/40 border border-surface-container hover:border-surface-container-high rounded-xl p-4 transition-all flex flex-col gap-2.5 shadow-xs"
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
                          <span className="font-mono text-sm font-semibold text-text-primary tracking-wide break-all">
                            {api.endpoint}
                          </span>
                        </div>

                        {api.file && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-secondary bg-surface-container-low px-2.5 py-1 rounded-md border border-surface-container max-w-full truncate">
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
            <div id="tab-content-pages" className="flex-1 min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6">
              {/* Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-hairline mb-6">
                <div>
                  <h2 className="text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-error text-xl">
                      description
                    </span>
                    <span>Frontend Pages & Routes</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-container text-text-secondary">
                      {pages.length} total
                    </span>
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Discovered pages, client routes, and layouts identified in the application.
                  </p>
                </div>

                {/* Search input */}
                <div className="bg-white border border-surface-container rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs shadow-xs w-full sm:w-auto">
                  <span className="material-symbols-outlined text-sm text-text-secondary">
                    search
                  </span>
                  <input
                    type="text"
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    placeholder="Filter routes, files..."
                    className="bg-transparent text-text-primary placeholder-[#94a3b8] outline-none font-mono text-xs w-full sm:w-64"
                  />
                  {pageSearch && (
                    <button
                      onClick={() => setPageSearch("")}
                      className="text-text-secondary hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Pages List / Empty state */}
              {repo?.status === "ANALYZING" || repo?.status === "PENDING" ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl bg-white border border-surface-container border-dashed">
                  <div className="w-10 h-10 border-2 border-error border-t-transparent rounded-full animate-spin mb-4" />
                  <h3 className="text-sm font-semibold text-text-primary font-mono">
                    Codebase Analysis in Progress
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm font-mono">
                    Frontend routes are currently being indexed from this repository.
                  </p>
                </div>
              ) : pages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl bg-white border border-surface-container border-dashed">
                  <span className="material-symbols-outlined text-4xl text-text-secondary mb-3">
                    auto_stories
                  </span>
                  <h3 className="text-sm font-semibold text-text-primary font-mono">
                    No Frontend Routes Detected
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm">
                    No application routes or view pages were found during the structural analysis.
                  </p>
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-surface border border-surface-container text-xs font-mono text-text-secondary">
                  No pages matching &quot;{pageSearch}&quot;
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredPages.map((page, idx) => (
                    <div
                      key={idx}
                      className="bg-white hover:bg-surface-container-low/40 border border-surface-container hover:border-surface-container-high rounded-xl p-4 transition-all flex flex-col justify-between gap-3 shadow-xs"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-error text-[18px]">
                            auto_stories
                          </span>
                          <span className="font-mono text-sm font-bold text-text-primary tracking-wide break-all">
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
                        <div className="pt-2.5 border-t border-surface-container flex items-center gap-1.5 text-[11px] font-mono text-text-secondary truncate">
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

          {/* ── DATABASES TAB ── */}
          {activeTab === "databases" && (
            <div id="tab-content-databases" className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border-hairline mb-4 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-text-primary tracking-tight flex items-center gap-2 flex-wrap">
                    <FontAwesomeIcon icon={faDatabase} className="text-primary text-base" />
                    <span>Database Schema</span>
                    {databaseSchema?.tables && databaseSchema.tables.length > 0 && (
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                        {databaseSchema.tables.length} {databaseSchema.tables.length === 1 ? "Table" : "Tables"}
                      </span>
                    )}
                    {databaseSchema?.relations && databaseSchema.relations.length > 0 && (
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 rounded-full">
                        {databaseSchema.relations.length} {databaseSchema.relations.length === 1 ? "Relation" : "Relations"}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Interactive visualization of database models, relations, and schema structure.
                  </p>
                </div>
              </div>

              {databaseSchema && databaseSchema.tables.length > 0 ? (
                <div className="flex-1 min-h-0 w-full border border-surface-container rounded-xl overflow-hidden bg-white shadow-xs">
                  <SchemaCanvas schema={databaseSchema} className="w-full h-full" />
                </div>
              ) : repo?.status === "ANALYZING" || repo?.status === "EMBEDDING" ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-border-hairline rounded-xl bg-surface-container/30">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
                    <FontAwesomeIcon icon={faDatabase} className="text-primary text-lg" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1">
                    Analyzing database schema...
                  </h3>
                  <p className="text-xs text-text-muted max-w-sm">
                    DocFlow is extracting models, entities, and relationships from the repository.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-border-hairline rounded-xl bg-surface-container/30">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faDatabase} className="text-text-muted text-lg" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1">
                    No database schema detected
                  </h3>
                  <p className="text-xs text-text-muted max-w-sm">
                    No Prisma, SQL, or ORM entity models were identified during repository analysis.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}