"use client";

import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faXTwitter,
  faFacebook,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";

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

const SOCIAL_LINKS = [
  {
    href: "https://x.com/Docflow_Ai",
    label: "X",
    icon: faXTwitter,
  },
  {
    href: "https://www.linkedin.com/company/docflow-software",
    label: "LinkedIn",
    icon: faLinkedin,
  },
  {
    href: "https://www.facebook.com/profile.php?id=61594930990733",
    label: "Facebook",
    icon: faFacebook,
  },
  {
    href: "https://www.instagram.com/docflow.software/",
    label: "Instagram",
    icon: faInstagram,
  },
];

export default function Footer() {
  return (
    <footer className="py-10 bg-surface-container-lowest border-t border-border-hairline">
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
            {SOCIAL_LINKS.map(({ href, label, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-text-secondary hover:text-primary transition-colors"
              >
                <FontAwesomeIcon icon={icon} style={{ width: 20, height: 20 }} />
              </a>
            ))}
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
      <div className="mt-10 pt-6 px-6 md:px-8 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs border-t border-border-hairline text-text-secondary">
        <p>
          &copy; 2026 DocFlow Inc. Built by{" "}
          <a
            href="https://omar-wael.site"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-text-primary hover:text-primary transition-colors"
          >
            Omar Wael
          </a>
          . All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/legal#privacy"
            className="transition-colors hover:text-primary"
          >
            Privacy Policy
          </Link>
          <Link
            href="/legal#terms"
            className="transition-colors hover:text-primary"
          >
            Terms of Service
          </Link>
          <Link
            href="/legal#refund"
            className="transition-colors hover:text-primary"
          >
            Refund Policy
          </Link>
          <Link
            href="/legal#cookies"
            className="transition-colors hover:text-primary"
          >
            Cookie Notice
          </Link>
        </div>
      </div>
    </footer>
  );
}
