"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // UI-only form handler
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#0b1326] text-[#dae2fd]">
      {/* Left Column - Brand & Welcome Info */}
      <div className="relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#060e20]/60 overflow-hidden">
        {/* Subtle decorative background glow */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20"
          style={{ background: "#4edea3" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-15"
          style={{ background: "#4cd7f6" }}
        />

        {/* Top Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center -ml-2">
            <Image
              src="/docflowtransparent.png"
              alt="DocFlow Logo"
              width={220}
              height={80}
              className="h-35 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Center Welcome Copy */}
        <div className="relative z-10 my-16 lg:my-0 max-w-lg">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f8fafc] tracking-tight leading-tight mb-4">
            Welcome back to your workspace.
          </h1>
          <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed">
            Pick up where you left off and keep your documentation in sync.
          </p>
        </div>

        {/* Bottom Copyright */}
        <div className="relative z-10">
          <p className="font-mono text-xs text-[#94a3b8]/70">
            © {new Date().getFullYear()} DocFlow Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="relative flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#0b1326]">
        {/* Ambient subtle glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[150px] pointer-events-none opacity-10"
          style={{ background: "#10b981" }}
        />

        <div className="relative z-10 w-full max-w-[420px] mx-auto flex flex-col">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f8fafc] tracking-tight">
              Log in to DocFlow
            </h2>
            <p className="text-sm text-[#94a3b8] mt-2">
              Enter your details to access your workspaces.
            </p>
          </div>

          {/* Social Login Button: GitHub */}
          <div className="flex flex-col gap-3 mb-6">
            <Link
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/auth/github`}
              id="github-login-btn"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200 cursor-pointer bg-[#f8fafc] text-[#0b1326] hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              {/* Font Awesome GitHub Icon */}
              <i className="fa-brands fa-github text-lg" aria-hidden="true" />
              <span>Log in with GitHub</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-white/[0.1] w-full" />
            <span className=" px-3 font-mono text-[11px] uppercase tracking-wider text-[#94a3b8]/70">
              or
            </span>
            <div className="border-t border-white/[0.1] w-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="font-mono text-xs font-medium text-[#dae2fd] uppercase tracking-wider"
              >
                Work Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full h-11 px-3.5 rounded-md bg-[#131b2e] border border-white/[0.12] text-[#dae2fd] placeholder:text-[#94a3b8]/50 text-sm focus:outline-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3] transition-colors"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="font-mono text-xs font-medium text-[#dae2fd] uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-11 px-3.5 rounded-md bg-[#131b2e] border border-white/[0.12] text-[#dae2fd] placeholder:text-[#94a3b8]/50 text-sm focus:outline-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3] transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit-btn"
              className="mt-3 w-full h-11 rounded-md font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center"
              style={{
                background: "#10b981",
                color: "#060e20",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#4edea3")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#10b981")
              }
            >
              Log In
            </button>
          </form>

          {/* Bottom Link to Register */}
          <div className="mt-8 text-center">
            <p className="font-mono text-xs text-[#94a3b8]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#4edea3] hover:underline underline-offset-4 ml-1"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}