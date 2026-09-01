"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Please upload a valid image file (JPEG, PNG, or WEBP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Avatar file size must be less than 5MB.");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("email", email.trim());
        formData.append("password", password);
        formData.append("username", username.trim());
        if (name.trim()) formData.append("name", name.trim());
        formData.append("avatar", avatarFile);

        await registerUser(formData);
      } else {
        await registerUser({
          email: email.trim(),
          password,
          username: username.trim(),
          name: name.trim() || undefined,
        });
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-background text-on-background">
      {/* Left Column - Brand & Value Proposition */}
      <div className="relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-surface-container-lowest/60 overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20 bg-primary" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-15 bg-secondary" />

        {/* Top Section: Logo + Value Proposition */}
        <div className="relative z-10 flex flex-col">
          {/* Top Logo */}
          <div>
            <Link href="/" className="inline-flex items-center -ml-2">
              <Image
                src="/docflowtransparent.png"
                alt="DocFlow Logo"
                width={220}
                height={80}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Value Proposition */}
          <div className="mt-2 sm:mt-4 max-w-lg">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-[1.15] mb-4">
              Stop writing docs.
              <br />
              <span className="text-primary">Start building.</span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              DocFlow automates your entire documentation pipeline with AI. Connect
              your repositories, let the models analyze your codebase, and deploy
              perfect, always-sync developer docs instantly.
            </p>
          </div>
        </div>

        {/* Bottom Footer Notice */}
        <div className="relative z-10 pt-8">
          <p className="font-mono text-xs text-text-secondary/70">
            © {new Date().getFullYear()} DocFlow Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Column - Workspace Registration Form */}
      <div className="relative flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-background">
        {/* Ambient subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[150px] pointer-events-none opacity-10 bg-primary-container" />

        <div className="relative z-10 w-full max-w-[440px] mx-auto flex flex-col py-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Create your workspace
            </h2>
            <p className="text-sm text-text-secondary mt-1.5">
              Get started with DocFlow for free.
            </p>
          </div>

          {/* Social Registration Button: GitHub only */}
          <div className="flex flex-col gap-3 mb-6">
            <Link
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/auth/github`}
              id="github-register-btn"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200 cursor-pointer bg-text-primary text-background hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              <i className="fa-brands fa-github text-lg" aria-hidden="true" />
              <span>Continue with GitHub</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-white/[0.1] w-full" />
            <span className="px-3 font-mono text-[11px] uppercase tracking-wider text-text-secondary/70">
              OR
            </span>
            <div className="border-t border-white/[0.1] w-full" />
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="p-3 mb-5 rounded-md flex items-center gap-2.5 text-xs text-error border border-error/30 bg-error-container/25">
              <span className="material-symbols-outlined text-base leading-none shrink-0">
                error
              </span>
              <span className="leading-tight">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Avatar Upload Section */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-surface-container-low/60 border border-white/[0.08]">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                id="avatar-upload"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-14 h-14 rounded-full bg-surface border-2 border-dashed border-white/20 hover:border-primary flex items-center justify-center cursor-pointer transition-all overflow-hidden shrink-0 group"
                title="Upload avatar"
              >
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-xl text-text-secondary group-hover:text-primary transition-colors">
                    add_a_photo
                  </span>
                )}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-on-background uppercase tracking-wider">
                    Avatar
                  </span>
                  {avatarFile && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-[11px] text-error hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-secondary/80 truncate mt-0.5">
                  {avatarFile ? avatarFile.name : "JPEG, PNG, or WEBP (Max 5MB)"}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-left text-xs font-semibold text-primary hover:underline mt-0.5"
                >
                  {avatarFile ? "Change photo" : "Upload photo"}
                </button>
              </div>
            </div>

            {/* Row: Name and Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Name Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="name"
                  className="font-mono text-xs font-medium text-on-background uppercase tracking-wider"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-11 px-3.5 rounded-md bg-surface-container-low border border-white/[0.12] text-on-background placeholder:text-text-secondary/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {/* Username Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="username"
                  className="font-mono text-xs font-medium text-on-background uppercase tracking-wider"
                >
                  Username <span className="text-primary">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe2"
                  required
                  className="w-full h-11 px-3.5 rounded-md bg-surface-container-low border border-white/[0.12] text-on-background placeholder:text-text-secondary/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* Work Email Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="font-mono text-xs font-medium text-on-background uppercase tracking-wider"
              >
                Work Email <span className="text-primary">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                required
                className="w-full h-11 px-3.5 rounded-md bg-surface-container-low border border-white/[0.12] text-on-background placeholder:text-text-secondary/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="font-mono text-xs font-medium text-on-background uppercase tracking-wider"
              >
                Password <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password@1234"
                  required
                  minLength={6}
                  className="w-full h-11 pl-3.5 pr-10 rounded-md bg-surface-container-low border border-white/[0.12] text-on-background placeholder:text-text-secondary/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-on-background focus:outline-none transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-text-secondary/70">
                Minimum 6 characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="register-submit-btn"
              disabled={isLoading}
              className="mt-2 w-full h-11 rounded-md font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary-container/10 bg-primary-container text-surface-container-lowest hover:bg-primary"
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-surface-container-lowest border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isLoading ? "Creating workspace…" : "Sign Up with Email"}</span>
            </button>
          </form>

          {/* Bottom Account Login Link */}
          <div className="mt-6 text-center">
            <p className="font-mono text-xs text-text-secondary">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline underline-offset-4 ml-1"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Terms & Privacy Policy */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-text-secondary/70 leading-relaxed">
              By signing up, you agree to our{" "}
              <Link
                href="#"
                className="text-text-secondary hover:text-on-background underline underline-offset-2"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="text-text-secondary hover:text-on-background underline underline-offset-2"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}