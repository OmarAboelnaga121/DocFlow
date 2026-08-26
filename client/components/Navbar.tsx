"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Architecture", href: "#architecture" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Documentation", href: "#docs" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

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

      {/* CTA */}
      <div className="hidden md:flex items-center gap-4">
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
          <Link href="/login" className="text-sm font-medium" style={{ color: "#94a3b8" }}>
            Log In
          </Link>
          <Link
            className="text-sm font-semibold px-4 py-2 rounded-[6px] w-full"
            style={{ background: "#10b981", color: "#0f172a" }}
            href="/register"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
