"use client";

import Image from "next/image";
import Link from "next/link";

const PRODUCT_LINKS = ["Features", "Pricing", "Integrations", "Changelog"];
const COMPANY_LINKS = ["About Us", "Careers", "Legal", "Contact"];

export default function Footer() {
  return (
    <footer
      className="py-10"
      style={{
        background: "#060e20",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 md:px-8 max-w-[1440px] mx-auto text-sm">
        {/* Brand */}
        <div className="col-span-1 md:col-span-1 flex flex-col">
          <Link href="/" className="flex items-center -mt-3.5 -mb-3.5 -ml-1">
            <Image
              src="/docflowtransparent.png"
              alt="DocFlow"
              width={150}
              height={60}
              className="object-contain"
            />
          </Link>
          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
            Codebase intelligence for modern product teams. Stop guessing,
            start shipping.
          </p>
        </div>

        {/* Product */}
        <div className="flex flex-col gap-3 pt-10">
          <h4
            className="font-mono text-[11px] font-semibold tracking-wider uppercase mb-1"
            style={{ color: "#f8fafc" }}
          >
            Product
          </h4>
          {PRODUCT_LINKS.map((link) => (
            <Link
              key={link}
              href="#"
              className="transition-colors"
              style={{ color: "#94a3b8" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#4edea3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              {link}
            </Link>
          ))}
        </div>


        {/* Company */}
        <div className="flex flex-col gap-3 pt-10">
          <h4
            className="font-mono text-[11px] font-semibold tracking-wider uppercase mb-1"
            style={{ color: "#f8fafc" }}
          >
            Company
          </h4>
          {COMPANY_LINKS.map((link) => (
            <Link
              key={link}
              href="#"
              className="transition-colors"
              style={{ color: "#94a3b8" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#4edea3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              {link}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className="mt-10 pt-6 px-6 md:px-8 max-w-[1440px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(148,163,184,0.6)",
        }}
      >
        <p>© 2026 DocFlow Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <Link
            href="#"
            className="transition-colors hover:text-white"
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            className="transition-colors hover:text-white"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
