"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "@/types";
import { logoutUser } from "@/lib/api";

interface UserNavDropdownProps {
  user: User;
  align?: "left" | "right";
  className?: string;
}

export default function UserNavDropdown({
  user,
  align = "right",
  className = "",
}: UserNavDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const displayName =
    user.name?.trim() ||
    user.username?.trim() ||
    user.email?.split("@")[0] ||
    "User";

  const userInitials = (displayName.charAt(0) || "U").toUpperCase();
  const userRole = user.userRole || user.role;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // Proceed to login even if logout request had a network hiccup
    } finally {
      setIsOpen(false);
      window.location.href = "/login";
    }
  };

  const alignClass = align === "left" ? "left-0" : "right-0";

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Sleek Circular Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="User account menu"
        className={`relative flex items-center justify-center w-8.5 h-8.5 rounded-full border transition-all duration-200 cursor-pointer shadow-xs focus:outline-none ${
          isOpen
            ? "border-primary ring-2 ring-primary/30"
            : "border-border-hairline hover:border-primary/60 hover:ring-2 hover:ring-primary/20"
        }`}
      >
        {user.avatar && !imageError ? (
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image
              src={user.avatar}
              alt={displayName}
              fill
              sizes="34px"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary to-emerald-400 text-white font-semibold text-xs flex items-center justify-center select-none uppercase tracking-wide">
            {userInitials}
          </div>
        )}
      </button>

      {/* Floating Dropdown Card */}
      {isOpen && (
        <div
          className={`absolute ${alignClass} top-full mt-2 w-64 rounded-2xl bg-surface border border-border-hairline shadow-xl backdrop-blur-xl p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-150`}
        >
          {/* User Profile Header */}
          <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-surface-container-low/70 border border-border-hairline">
            {user.avatar && !imageError ? (
              <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-border-hairline">
                <Image
                  src={user.avatar}
                  alt={displayName}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-emerald-400 text-white font-semibold text-xs flex items-center justify-center shrink-0 uppercase">
                {userInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-text-primary truncate">
                  {displayName}
                </span>
                {userRole && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                    {userRole}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-secondary truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          <div className="h-px bg-surface-container my-1" />

          {/* Navigation Links */}
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              dashboard
            </span>
            <span>Dashboard</span>
          </Link>

          <Link
            href="/dashboard/user"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">
              person
            </span>
            <span>User Profile & Settings</span>
          </Link>

          <div className="h-px bg-surface-container my-1" />

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors w-full text-left cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              logout
            </span>
            <span>{isLoggingOut ? "Signing out..." : "Log Out"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
