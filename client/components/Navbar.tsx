"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/api";
import { User } from "@/types";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Architecture", href: "#architecture" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Documentation", href: "#docs" },
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
        if (isMounted && profile && profile.id) {
          setUser(profile);
        }
      })
      .catch(() => {
        if (isMounted) {
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
      className="fixed top-0 w-full h-[68px] z-50 flex items-center justify-between px-6 md:px-8 relative"
      style={{
        background: "rgba(15, 23, 42, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
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
            className="text-sm font-medium transition-colors"
            style={{ color: "#bbcabf" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "#dae2fd")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "#bbcabf")
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Auth Actions / Profile */}
      <div className="hidden md:flex items-center gap-4">
        {isLoadingAuth ? (
          <div className="h-9 w-28 rounded-full bg-white/[0.05] animate-pulse" />
        ) : user ? (
          <Link
            href="/dashboard"
            id="navbar-profile-btn"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#131b2e] border border-white/[0.12] hover:border-[#4edea3]/60 hover:bg-[#18233d] transition-all duration-200 group cursor-pointer shadow-sm"
          >
            {user.avatar && !imageError ? (
              <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/[0.15] shrink-0">
                <Image
                  src={user.avatar}
                  alt={displayName}
                  fill
                  sizes="28px"
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#10b981] to-[#4edea3] text-[#060e20] font-bold text-xs flex items-center justify-center shrink-0">
                {userInitials}
              </div>
            )}
            <span className="text-sm font-medium text-[#dae2fd] group-hover:text-white transition-colors max-w-[130px] truncate">
              {displayName}
            </span>
            <span className="material-symbols-outlined text-base text-[#94a3b8] group-hover:text-[#4edea3] group-hover:translate-x-0.5 transition-all leading-none">
              chevron_right
            </span>
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm font-medium transition-colors"
              style={{ color: "#94a3b8" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              Log In
            </Link>
            <Link
              id="navbar-trial-btn"
              className="text-sm font-semibold px-[18px] py-2 rounded-[6px] transition-opacity hover:opacity-90 cursor-pointer"
              style={{ background: "#10b981", color: "#0f172a" }}
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
        className="md:hidden flex items-center justify-center w-10 h-10"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
        style={{ color: "#dae2fd" }}
      >
        <span className="material-symbols-outlined">
          {menuOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div
          className="absolute top-[68px] left-0 right-0 flex flex-col gap-4 px-6 py-6 md:hidden"
          style={{
            background: "rgba(15, 23, 42, 0.97)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium"
              style={{ color: "#bbcabf" }}
            >
              {link.label}
            </Link>
          ))}
          <hr style={{ borderColor: "rgba(255,255,255,0.08)" }} />

          {isLoadingAuth ? (
            <div className="h-10 w-full rounded-md bg-white/[0.05] animate-pulse" />
          ) : user ? (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-lg bg-[#131b2e] border border-white/[0.12] hover:border-[#4edea3]/50 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                {user.avatar && !imageError ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/[0.15] shrink-0">
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#10b981] to-[#4edea3] text-[#060e20] font-bold text-xs flex items-center justify-center shrink-0">
                    {userInitials}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-[#f8fafc] truncate">
                    {displayName}
                  </span>
                  <span className="text-xs text-[#4edea3] flex items-center gap-1">
                    Open Dashboard
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-sm text-[#4edea3]">
                chevron_right
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium"
                style={{ color: "#94a3b8" }}
              >
                Log In
              </Link>
              <Link
                className="text-sm font-semibold px-4 py-2 rounded-[6px] w-full text-center"
                style={{ background: "#10b981", color: "#0f172a" }}
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
