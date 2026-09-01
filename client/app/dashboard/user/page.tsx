"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getUserProfile, updateUserProfile, updateUserRole, logoutUser } from "@/lib/api";
import { User, UserRole } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export type ProfileTab = "general" | "role" | "account";

export default function UserProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("general");
  const [isLoading, setIsLoading] = useState(true);

  // Part 2: Form & Avatar State
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Part 3: Role Switcher State
  const [selectedRole, setSelectedRole] = useState<UserRole>("DEVELOPER");
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Part 4: Logout State
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchUser() {
      try {
        const data = await getUserProfile();
        if (isMounted) {
          if (data && data.id) {
            setUser(data);
            setName(data.name || "");
            setUsername(data.username || "");
            setAvatarPreview(data.avatar || null);
            const userRole = ((data.userRole || data.role || "USER") as UserRole).toUpperCase() as UserRole;
            setSelectedRole(userRole);
          } else {
            router.replace("/login");
          }
        }
      } catch (err) {
        if (isMounted) {
          router.replace("/login");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchUser();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Handle avatar file selection
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: "error",
        message: "Avatar image must be smaller than 5MB.",
      });
      return;
    }

    // Validate format
    if (!file.type.startsWith("image/")) {
      setFeedback({
        type: "error",
        message: "Please select a valid image file (JPEG, PNG, WEBP).",
      });
      return;
    }

    setFeedback(null);
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  // Revert selected avatar
  const handleCancelNewAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(user?.avatar || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Copy user ID to clipboard
  const handleCopyUserId = async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Reset profile inputs to current saved user
  const handleResetProfile = () => {
    if (!user) return;
    setName(user.name || "");
    setUsername(user.username || "");
    handleCancelNewAvatar();
    setFeedback(null);
  };

  // Save profile changes (Part 2)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    if (trimmedUsername && trimmedUsername.length < 3) {
      setFeedback({
        type: "error",
        message: "Username must be at least 3 characters long.",
      });
      return;
    }

    setIsSavingProfile(true);
    setFeedback(null);

    try {
      let res: { message: string; user: User };

      if (avatarFile) {
        const formData = new FormData();
        if (trimmedName) formData.append("name", trimmedName);
        if (trimmedUsername) formData.append("username", trimmedUsername);
        formData.append("avatar", avatarFile);
        res = await updateUserProfile(formData);
      } else {
        res = await updateUserProfile({
          name: trimmedName || undefined,
          username: trimmedUsername || undefined,
        });
      }

      const updatedUser: User = res.user;

      setUser(updatedUser);
      setName(updatedUser.name || "");
      setUsername(updatedUser.username || "");
      setAvatarPreview(updatedUser.avatar || null);
      setAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setFeedback({
        type: "success",
        message: res.message || "Profile updated successfully.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setFeedback({
        type: "error",
        message: msg,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const hasChanges =
    Boolean(user) &&
    (name !== (user?.name || "") ||
      username !== (user?.username || "") ||
      avatarFile !== null);

  const currentSavedRole = (((user?.userRole || user?.role || "USER") as string).toUpperCase()) as UserRole;
  const hasRoleChanges = Boolean(user) && selectedRole !== currentSavedRole;

  const handleResetRole = () => {
    if (!user) return;
    setSelectedRole(currentSavedRole);
    setFeedback(null);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasRoleChanges) return;

    setIsSavingRole(true);
    setFeedback(null);

    try {
      const res = await updateUserRole(user.id, selectedRole);
      const updatedUser: User = (res && "user" in res && res.user) ? res.user : { ...user, userRole: selectedRole, role: selectedRole };
      setUser(updatedUser);
      setFeedback({
        type: "success",
        message: (res && "message" in res && res.message) ? res.message : `Workspace role successfully updated to ${selectedRole}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role";
      setFeedback({
        type: "error",
        message: msg,
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      router.replace("/login");
    } catch {
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
            <Link
              href="/dashboard"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Dashboard
            </Link>
            <span className="text-outline-variant">/</span>
            <span className="text-on-background">Account Settings</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-surface-container-low border border-white/10 text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {user?.authProvider === "GITHUB" ? "GitHub Connected" : "Local Account"}
            </span>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 rounded-xl bg-surface-container border border-white/5" />
            <div className="h-10 w-80 rounded-lg bg-surface-container border border-white/5" />
            <div className="h-96 rounded-xl bg-surface-container border border-white/5" />
          </div>
        ) : user ? (
          <div className="space-y-8">
            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium transition-all ${feedback.type === "success"
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-error/10 border-error/30 text-error"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px]">
                    {feedback.type === "success" ? "check_circle" : "error"}
                  </span>
                  <span>{feedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="text-xs opacity-70 hover:opacity-100 font-mono transition-opacity cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Profile Overview Header Card */}
            <div className="relative rounded-2xl bg-surface-container-low border border-white/10 p-6 md:p-8 overflow-hidden shadow-xl">
              {/* Subtle background glow accent */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start md:items-center gap-5">
                  {/* Avatar */}
                  <div className="relative group">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-surface border-2 border-white/10 overflow-hidden flex items-center justify-center shadow-md">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt={name || username || "User"}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          unoptimized={avatarPreview.startsWith("blob:")}
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary font-mono">
                          {(name || username || user.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User meta details */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {user.name || user.username || "Anonymous User"}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wide uppercase font-semibold bg-primary/10 text-primary border border-primary/20">
                        {user.userRole || user.role || "USER"}
                      </span>
                    </div>

                    <p className="text-sm text-text-secondary font-mono flex items-center gap-2">
                      <span>@{user.username || "username_not_set"}</span>
                      <span className="text-outline-variant">•</span>
                      <span>{user.email}</span>
                    </p>

                    <p className="text-xs text-text-secondary">
                      Member since{" "}
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                        : "Recent"}
                    </p>
                  </div>
                </div>

                {/* Quick Action / Status */}
                <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                  <span className="text-xs text-text-secondary font-mono">Profile Sync Status</span>
                  <span className="text-xs text-primary flex items-center gap-1 font-mono">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Active & Synced
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-px overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap cursor-pointer ${activeTab === "general"
                    ? "text-primary font-semibold"
                    : "text-text-secondary hover:text-white"
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                General Profile
                {activeTab === "general" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(78,222,163,0.6)]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("role")}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap cursor-pointer ${activeTab === "role"
                    ? "text-primary font-semibold"
                    : "text-text-secondary hover:text-white"
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">badge</span>
                Role & Workspace
                {activeTab === "role" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(78,222,163,0.6)]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("account")}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap cursor-pointer ${activeTab === "account"
                    ? "text-primary font-semibold"
                    : "text-text-secondary hover:text-white"
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">shield</span>
                Security & Activity
                {activeTab === "account" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(78,222,163,0.6)]" />
                )}
              </button>
            </div>

            {/* Tab Content Panels */}
            {activeTab === "general" && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="rounded-2xl bg-surface-container-low/70 border border-white/10 p-6 md:p-8 space-y-8">
                  {/* Section Title */}
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-lg font-semibold text-white">Public Profile</h2>
                    <p className="text-xs text-text-secondary mt-1">
                      Manage how your name, handle, and avatar appear in code reviews and discussions.
                    </p>
                  </div>

                  {/* Avatar Upload Field */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-surface border-2 border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
                        {avatarPreview ? (
                          <Image
                            src={avatarPreview}
                            alt="Avatar Preview"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            unoptimized={avatarPreview.startsWith("blob:")}
                          />
                        ) : (
                          <span className="text-2xl font-bold text-primary font-mono">
                            {(name || username || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {avatarFile && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-surface-container-low flex items-center justify-center text-[9px] text-background font-bold">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={handleAvatarFileSelect}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surface-variant border border-white/10 text-xs font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">upload</span>
                          Change Avatar
                        </button>
                        {avatarFile && (
                          <button
                            type="button"
                            onClick={handleCancelNewAvatar}
                            className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-white/5 text-xs text-text-secondary hover:text-white transition-colors cursor-pointer"
                          >
                            Revert
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748b]">
                        JPG, PNG, or WEBP. Max size 5MB.
                      </p>
                    </div>
                  </div>

                  {/* Form Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Display Name */}
                    <div className="space-y-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary">
                        Display Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all font-sans"
                        />
                        <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-secondary/60 text-[18px] pointer-events-none">
                          badge
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        Your name visible on reports and shared chats.
                      </p>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary">
                        Username Handle
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-sm font-mono text-text-secondary select-none">
                          @
                        </span>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                          placeholder="username"
                          className="w-full bg-background border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        Unique handle. Letters, numbers, hyphens only (min 3 chars).
                      </p>
                    </div>

                    {/* Email (Read-only) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary">
                          Email Address
                        </label>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {user.authProvider === "GITHUB" ? "GitHub Synced" : "Verified Primary"}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full bg-background/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-text-secondary cursor-not-allowed font-mono opacity-80"
                        />
                        <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-secondary/60 text-[18px] pointer-events-none">
                          lock
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        Email is managed via your authentication provider.
                      </p>
                    </div>

                    {/* User ID (Read-only + Copy) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary">
                          User Identifier
                        </label>
                        {copiedId && (
                          <span className="text-[10px] font-mono text-primary">
                            Copied to clipboard!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={user.id}
                            disabled
                            className="w-full bg-background/50 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-text-secondary cursor-not-allowed font-mono truncate opacity-80"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUserId}
                          title="Copy User ID"
                          className="px-3 py-2.5 rounded-xl bg-surface hover:bg-surface-variant border border-white/10 text-white transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {copiedId ? "check" : "content_copy"}
                          </span>
                        </button>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        Your internal unique account ID.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Action Controls */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    {hasChanges && (
                      <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Unsaved changes pending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetProfile}
                      disabled={!hasChanges || isSavingProfile}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      Discard
                    </button>

                    <button
                      type="submit"
                      disabled={!hasChanges || isSavingProfile}
                      className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-background text-xs font-semibold font-mono tracking-wide transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
                    >
                      {isSavingProfile ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">save</span>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Part 3: Role & Workspace Selector */}
            {activeTab === "role" && (
              <form onSubmit={handleSaveRole} className="space-y-6">
                <div className="rounded-2xl bg-surface-container-low/70 border border-white/10 p-6 md:p-8 space-y-6">
                  {/* Section Title */}
                  <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Workspace Role & Mode</h2>
                      <p className="text-xs text-text-secondary mt-1">
                        Tailors documentation depth, AST analysis capabilities, and AI assistant prompt context.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-background border border-white/10 text-xs font-mono text-text-secondary">
                      <span>Current Mode:</span>
                      <span className="font-bold text-primary">{currentSavedRole}</span>
                    </div>
                  </div>

                  {/* Role Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Developer Card */}
                    <div
                      onClick={() => setSelectedRole("DEVELOPER")}
                      className={`relative cursor-pointer rounded-xl p-5 transition-all duration-200 flex flex-col justify-between border ${selectedRole === "DEVELOPER"
                          ? "bg-surface/90 border-primary shadow-[0_0_24px_rgba(78,222,163,0.12)] ring-1 ring-primary"
                          : "bg-background/70 border-white/10 hover:border-white/20 hover:bg-surface/50"
                        }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${selectedRole === "DEVELOPER"
                                ? "bg-primary/15 text-primary"
                                : "bg-white/5 text-text-secondary"
                              }`}
                          >
                            <span className="material-symbols-outlined text-[22px]">terminal</span>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedRole === "DEVELOPER"
                                ? "border-primary bg-primary text-background"
                                : "border-white/30 bg-transparent"
                              }`}
                          >
                            {selectedRole === "DEVELOPER" && (
                              <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">Developer</h3>
                            {currentSavedRole === "DEVELOPER" && (
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary font-medium">
                            Codebase AST & Technical Docs
                          </p>
                        </div>

                        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                          Full git repository indexing, AST-driven interactive API documentation, and code review insights.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                        <span className="px-2 py-0.5 rounded bg-background border border-white/5 text-[10px] font-mono text-on-background">
                          Git Repos
                        </span>
                        <span className="px-2 py-0.5 rounded bg-background border border-white/5 text-[10px] font-mono text-on-background">
                          AST Parsers
                        </span>
                        <span className="px-2 py-0.5 rounded bg-background border border-white/5 text-[10px] font-mono text-on-background">
                          APIs
                        </span>
                      </div>
                    </div>

                    {/* Business Card */}
                    <div
                      onClick={() => setSelectedRole("BUSINESS")}
                      className={`relative cursor-pointer rounded-xl p-5 transition-all duration-200 flex flex-col justify-between border ${selectedRole === "BUSINESS"
                          ? "bg-surface/90 border-secondary shadow-[0_0_24px_rgba(76,215,246,0.12)] ring-1 ring-secondary"
                          : "bg-background/70 border-white/10 hover:border-white/20 hover:bg-surface/50"
                        }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${selectedRole === "BUSINESS"
                                ? "bg-secondary/15 text-secondary"
                                : "bg-white/5 text-text-secondary"
                              }`}
                          >
                            <span className="material-symbols-outlined text-[22px]">business_center</span>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedRole === "BUSINESS"
                                ? "border-secondary bg-secondary text-background"
                                : "border-white/30 bg-transparent"
                              }`}
                          >
                            {selectedRole === "BUSINESS" && (
                              <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">Product / Business</h3>
                            {currentSavedRole === "BUSINESS" && (
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary font-medium">
                            Architecture & Executive Summaries
                          </p>
                        </div>

                        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                          High-level architecture digests, functional project tracking, and simplified workflow summaries.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                        <span className="px-2 py-0.5 rounded bg-background border border-white/5 text-[10px] font-mono text-on-background">
                          Summaries
                        </span>
                        <span className="px-2 py-0.5 rounded bg-background border border-white/5 text-[10px] font-mono text-on-background">
                          Insights
                        </span>
                        <span className="px-2 py-0.5 rounded bg-background border border-white/5 text-[10px] font-mono text-on-background">
                          Workflows
                        </span>
                      </div>
                    </div>

                    {/* General User Card */}
                    <div
                      onClick={() => setSelectedRole("USER")}
                      className={`relative cursor-pointer rounded-xl p-5 transition-all duration-200 flex flex-col justify-between border ${selectedRole === "USER"
                          ? "bg-surface/90 border-[#a78bfa] shadow-[0_0_24px_rgba(167,139,250,0.12)] ring-1 ring-[#a78bfa]"
                          : "bg-background/70 border-white/10 hover:border-white/20 hover:bg-surface/50"
                        }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${selectedRole === "USER"
                                ? "bg-[#a78bfa]/15 text-[#a78bfa]"
                                : "bg-white/5 text-text-secondary"
                              }`}
                          >
                            <span className="material-symbols-outlined text-[22px]">explore</span>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedRole === "USER"
                                ? "border-[#a78bfa] bg-[#a78bfa] text-background"
                                : "border-white/30 bg-transparent"
                              }`}
                          >
                            {selectedRole === "USER" && (
                              <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">General User</h3>
                            {currentSavedRole === "USER" && (
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#a78bfa]/20 text-[#a78bfa] font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary font-medium">
                            Documentation & Chat Reader
                          </p>
                        </div>

                        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                          Search documentation libraries, query codebases with conversational chat, and explore shared repositories.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                        <span className="px-2 py-0.5 rounded bg-background border border-white/5 text-[10px] font-mono text-on-background">
                          Doc Viewer
                        </span>
                        <span className="px-2 py-0.5 rounded bg-background border border-white/5 text-[10px] font-mono text-on-background">
                          Knowledge Q&A
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Action Controls */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    {hasRoleChanges && (
                      <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Role switch pending: {currentSavedRole} → {selectedRole}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetRole}
                      disabled={!hasRoleChanges || isSavingRole}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      Discard
                    </button>

                    <button
                      type="submit"
                      disabled={!hasRoleChanges || isSavingRole}
                      className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-background text-xs font-semibold font-mono tracking-wide transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
                    >
                      {isSavingRole ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                          Updating Role...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          Apply Workspace Role
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Part 4: Simple Session Logout */}
            {activeTab === "account" && (
              <div className="rounded-2xl bg-surface-container-low/70 border border-white/10 p-6 md:p-8 space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <h2 className="text-lg font-semibold text-white">Account Session</h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Manage your active authentication session on this device.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-background/50 border border-white/5">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        verified_user
                      </span>
                      Signed in as <span className="font-mono text-primary">{user.email}</span>
                    </p>
                    <p className="text-xs text-text-secondary">
                      Logging out will terminate your current session and clear your authentication cookies.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-5 py-2.5 rounded-xl bg-error/10 hover:bg-error/20 border border-error/30 text-error text-xs font-semibold font-mono tracking-wide transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-sm"
                  >
                    {isLoggingOut ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-error border-t-transparent rounded-full animate-spin" />
                        Logging Out...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        Log Out
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}


