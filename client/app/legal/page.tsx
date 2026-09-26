import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Legal | DocFlow",
  description:
    "Review DocFlow's terms of service, privacy notice, cookie notice, and privacy rights information.",
};

const sections = [
  { id: "terms", label: "Terms of Service" },
  { id: "privacy", label: "Privacy Notice" },
  { id: "cookies", label: "Cookie Notice" },
  { id: "rights", label: "Your Rights" },
];

export default function LegalPage() {
  return (
    <>
      <Navbar />
      <main className="w-full bg-background text-on-background px-6 md:px-8 pt-28 pb-20">
        <div className="max-w-6xl mx-auto">
          <header className="max-w-3xl mb-12">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-secondary mb-4">
              DocFlow policies
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-5">
              Legal and privacy
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Clear information about using DocFlow, how we handle data, and the
              choices available to people who use our service.
            </p>
            <p className="text-sm text-text-secondary mt-5">
              Last updated: September 26, 2026
            </p>
          </header>

          <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-10 lg:gap-16 items-start">
            <nav
              aria-label="Legal documents"
              className="lg:sticky lg:top-28 border-l-2 border-surface-container pl-4"
            >
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-4">
                On this page
              </p>
              <ul className="space-y-3 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-text-secondary hover:text-primary transition-colors"
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="max-w-3xl space-y-12">
              <section id="terms" aria-labelledby="terms-heading" className="scroll-mt-28">
                <h2 id="terms-heading" className="text-2xl font-semibold text-on-surface mb-4">
                  Terms of Service
                </h2>
                <div className="space-y-4 text-text-secondary leading-relaxed">
                  <p>
                    By accessing or using DocFlow, you agree to use the service
                    lawfully and responsibly. You are responsible for the content
                    and repositories you connect, and for keeping your account
                    credentials secure.
                  </p>
                  <p>
                    DocFlow is provided on an evolving basis. We may improve,
                    suspend, or discontinue features, and we may restrict access
                    where necessary to protect the service, its users, or the
                    rights of others.
                  </p>
                  <p>
                    Do not use DocFlow to upload unlawful material, infringe
                    another person&apos;s rights, bypass security controls, or make
                    high-impact decisions without appropriate human review.
                    AI-generated results should be checked before they are relied
                    upon.
                  </p>
                </div>
              </section>

              <section id="privacy" aria-labelledby="privacy-heading" className="scroll-mt-28">
                <h2 id="privacy-heading" className="text-2xl font-semibold text-on-surface mb-4">
                  Privacy Notice
                </h2>
                <div className="space-y-4 text-text-secondary leading-relaxed">
                  <p>
                    We may process account details, authentication information,
                    repository content, usage information, and messages you send
                    to support. We use this information to provide, secure, and
                    improve DocFlow, communicate with you, and meet legal
                    obligations.
                  </p>
                  <p>
                    We do not sell personal information. Access is limited to
                    people and service providers who need it to operate DocFlow,
                    subject to appropriate confidentiality and security duties.
                    Data may be processed in countries other than where you live,
                    with safeguards required by applicable law.
                  </p>
                  <p>
                    We retain information only as long as reasonably needed for
                    the purposes described here, account operation, dispute
                    resolution, security, and legal compliance. Contact us to ask
                    about access, correction, deletion, portability, or objection
                    rights.
                  </p>
                </div>
              </section>

              <section id="cookies" aria-labelledby="cookies-heading" className="scroll-mt-28">
                <h2 id="cookies-heading" className="text-2xl font-semibold text-on-surface mb-4">
                  Cookie Notice
                </h2>
                <div className="space-y-4 text-text-secondary leading-relaxed">
                  <p>
                    DocFlow may use essential cookies or similar technologies to
                    keep you signed in, protect the service, and remember
                    necessary preferences. Where non-essential technologies are
                    introduced, we will request consent where required and
                    explain how to change your choices.
                  </p>
                  <p>
                    Your browser can block or delete cookies, but doing so may
                    prevent parts of DocFlow from working correctly.
                  </p>
                </div>
              </section>

              <section id="rights" aria-labelledby="rights-heading" className="scroll-mt-28">
                <h2 id="rights-heading" className="text-2xl font-semibold text-on-surface mb-4">
                  Your Rights and Contact
                </h2>
                <div className="space-y-4 text-text-secondary leading-relaxed">
                  <p>
                    Depending on where you live, you may have rights over your
                    personal information, including access, correction,
                    deletion, restriction, portability, and the right to object
                    or withdraw consent. We may need to verify your identity
                    before completing a request.
                  </p>
                  <p>
                    Email privacy questions or requests to{" "}
                    <a
                      href="mailto:docflow.work@gmail.com"
                      className="text-secondary underline underline-offset-4 hover:text-primary"
                    >
                      docflow.work@gmail.com
                    </a>
                    . We will respond within the timeframe required by applicable
                    law. You may also contact your local data-protection
                    authority.
                  </p>
                </div>
              </section>

              <aside className="border border-secondary/30 bg-surface-container-low p-5 text-sm text-text-secondary leading-relaxed">
                <strong className="text-on-surface">Before launch:</strong> This
                page is a product-facing overview, not legal advice. DocFlow Inc.
                should have counsel review and finalize the governing law,
                processing locations, retention periods, subprocessors, security
                commitments, regional disclosures, and any consent controls before
                accepting users.
              </aside>

              <Link href="/" className="inline-flex text-secondary hover:text-primary transition-colors">
                <span aria-hidden="true">←</span>
                <span className="ml-2">Back to home</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
