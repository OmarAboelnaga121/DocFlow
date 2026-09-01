"use client";

import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";

const PRODUCT_LINKS: { label: string; href: string }[] = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Integrations", href: "/integrations" },
];

const COMPANY_LINKS: { label: string; href: string }[] = [
  { label: "About Us", href: "/about-us" },
  { label: "Careers", href: "/careers" },
  { label: "Legal", href: "/legal" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="py-10 bg-surface-container-lowest border-t border-white/[0.08]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 md:px-8 max-w-[1440px] mx-auto text-sm">
        {/* Brand */}
        <div className="col-span-2 md:col-span-2 flex flex-col gap-4">
          <Link href="/" className="flex items-center -mt-3.5 -mb-3.5 -ml-1">
            <Image
              src="/docflowtransparent.png"
              alt="DocFlow"
              width={150}
              height={60}
              className="object-contain"
            />
          </Link>
          <p className="text-sm leading-relaxed max-w-xs text-text-secondary">
            Codebase intelligence for modern product teams. Stop guessing,
            start shipping.
          </p>
          {/* Social icons */}
          <div className="flex items-center gap-4 mt-2">
            <a
              href="https://github.com/OmarAboelnaga121"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-text-secondary hover:text-primary transition-colors"
            >
              <FontAwesomeIcon icon={faGithub} style={{ width: 20, height: 20 }} />
            </a>
            <a
              href="https://www.linkedin.com/in/omar-aboelnaga-66522a343/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-text-secondary hover:text-primary transition-colors"
            >
              <FontAwesomeIcon icon={faLinkedin} style={{ width: 20, height: 20 }} />
            </a>
          </div>
        </div>

        {/* Product */}
        <div className="flex flex-col gap-3 pt-10">
          <h4 className="font-mono text-[11px] font-semibold tracking-wider uppercase mb-1 text-text-primary">
            Product
          </h4>
          {PRODUCT_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="transition-colors text-text-secondary hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Company */}
        <div className="flex flex-col gap-3 pt-10">
          <h4 className="font-mono text-[11px] font-semibold tracking-wider uppercase mb-1 text-text-primary">
            Company
          </h4>
          {COMPANY_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="transition-colors text-text-secondary hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-10 pt-6 px-6 md:px-8 max-w-[1440px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs border-t border-white/[0.08] text-text-secondary/60">
        <p>
          © 2026 DocFlow Inc. Built by{" "}
          <a
            href="https://github.com/OmarAboelnaga121"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            Omar Wael
          </a>
          . All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link
            href="/legal"
            className="transition-colors hover:text-white"
          >
            Privacy Policy
          </Link>
          <Link
            href="/legal"
            className="transition-colors hover:text-white"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
