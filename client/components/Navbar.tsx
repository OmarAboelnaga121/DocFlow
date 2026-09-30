"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserProfile, logoutUser } from "@/lib/api";
import { User } from "@/types";
import UserNavDropdown from "@/components/UserNavDropdown";

const NAV_LINKS = [
  { label: "Product", href: "/#product" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Architecture", href: "/#architecture" },
  { label: "Use Cases", href: "/#use-cases" },
  { label: "Pricing", href: "/pricing" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getUserProfile()
      .then((profile) => {
        if (!isMounted) return;
        if (profile && profile.id) {
          setUser(profile);
        }
      })
      .catch(() => {
        if (!isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);



  const displayName =
    user?.name || user?.username || user?.email?.split("@")[0] || "User";
  const userInitials = (displayName.charAt(0) || "U").toUpperCase();

  return (
    <header
      id="navbar"
      className="fixed top-0 w-full h-[68px] z-50 flex items-center justify-between px-6 md:px-8 bg-surface-container-lowest/90 backdrop-blur-md border-b border-border-hairline"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center flex-shrink-0">
        <Image
          src="/docflowtransparent.png"
          alt="DocFlow Logo"
          width={3000}
          height={1000}
          className="h-35 w-auto object-contain"
          priority
        />
      </Link>

      {/* Desktop Nav — absolutely centered in the header */}
      <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-sm font-medium transition-colors text-on-surface-variant hover:text-on-background"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Auth Actions / Profile */}
      <div className="hidden md:flex items-center gap-4">
        {isLoadingAuth ? (
          <div className="h-8.5 w-8.5 rounded-full bg-surface-container animate-pulse" />
        ) : user ? (
          <UserNavDropdown user={user} />
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm font-medium transition-colors text-text-secondary hover:text-text-primary"
            >
              Log In
            </Link>
            <Link
              id="navbar-trial-btn"
              className="text-sm font-semibold px-[18px] py-2 rounded-[6px] transition-opacity hover:opacity-90 cursor-pointer bg-primary-container text-surface-container-lowest"
              href="/register"
            >
              Get Started
            </Link>
          </>
        )}
      </div>

      {/* Mobile Hamburger */}
      <button
        id="navbar-mobile-menu-btn"
        className="md:hidden flex items-center justify-center w-10 h-10 text-on-background"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined">
          {menuOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="absolute top-[68px] left-0 right-0 flex flex-col gap-4 px-6 py-6 md:hidden bg-surface/98 backdrop-blur-md border-b border-border-hairline shadow-xl">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-on-surface-variant hover:text-on-background"
            >
              {link.label}
            </Link>
          ))}
          <hr className="border-border-hairline" />

          {isLoadingAuth ? (
            <div className="h-10 w-full rounded-md bg-surface-container animate-pulse" />
          ) : user ? (
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-surface-container hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatar && !imageError ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <Image
                        src={user.avatar}
                        alt={displayName}
                        fill
                        sizes="32px"
                        className="object-cover"
                        onError={() => setImageError(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-container to-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {userInitials}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-text-primary truncate">
                      {displayName}
                    </span>
                    <span className="text-xs text-primary flex items-center gap-1">
                      Dashboard
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-sm text-primary">
                  chevron_right
                </span>
              </Link>

              <Link
                href="/dashboard/user"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-surface-container hover:border-secondary/50 transition-all text-xs font-medium text-text-secondary hover:text-on-surface"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    person
                  </span>
                  <span>User Profile & Settings</span>
                </div>
                <span className="material-symbols-outlined text-sm text-text-secondary">
                  chevron_right
                </span>
              </Link>

              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  try {
                    await logoutUser();
                  } finally {
                    window.location.href = "/login";
                  }
                }}
                className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">
                    logout
                  </span>
                  <span>Log Out</span>
                </div>
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-text-secondary"
              >
                Log In
              </Link>
              <Link
                className="text-sm font-semibold px-4 py-2 rounded-[6px] w-full text-center bg-primary-container text-surface-container-lowest"
                href="/register"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
