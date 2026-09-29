import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Legal & Compliance Policies | DocFlow",
  description:
    "Review DocFlow's terms of service, privacy notice, refund policy, cookie notice, and data subject rights.",
};

const sections = [
  { id: "terms", label: "Terms of Service" },
  { id: "privacy", label: "Privacy Notice" },
  { id: "refund", label: "Refund Policy" },
  { id: "cookies", label: "Cookie Policy" },
  { id: "age-policy", label: "Children's Privacy" },
  { id: "rights", label: "Data Deletion & Rights" },
  { id: "business", label: "Business Details" },
];

export default function LegalPage() {
  return (
    <>
      <Navbar />
      <main className="w-full bg-background text-on-background px-6 md:px-8 pt-28 pb-20">
        <div className="max-w-6xl mx-auto">
          <header className="max-w-3xl mb-12">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-4">
              DocFlow Governance & Compliance
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-5">
              Legal, Privacy, and Service Terms
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Clear commitments regarding our terms of service, customer rights, data protection practices, and payment transparency.
            </p>
            <p className="text-sm text-text-secondary mt-5">
              Last updated: September 30, 2026
            </p>
          </header>

          <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-10 lg:gap-16 items-start">
            <nav
              aria-label="Legal documents navigation"
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
                      className="text-text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="max-w-3xl space-y-16">
              {/* 1. Terms of Service */}
              <section id="terms" aria-labelledby="terms-heading" className="scroll-mt-28">
                <h2 id="terms-heading" className="text-2xl font-bold text-text-primary mb-4">
                  1. Terms of Service
                </h2>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm">
                  <p>
                    By creating an account or accessing DocFlow, you agree to enter into a legally binding agreement with DocFlow Inc. You must be at least 18 years old or the legal age of majority in your jurisdiction to use the service.
                  </p>
                  <p>
                    <strong className="text-text-primary">Intellectual Property & Repositories:</strong> You retain all ownership rights and intellectual property in the repositories and codebases you ingest into DocFlow. By using the platform, you grant DocFlow a limited license strictly to parse, index, generate vector embeddings, and synthesize answers solely for your authorized workspace users.
                  </p>
                  <p>
                    <strong className="text-text-primary">AI & Output Disclaimer:</strong> DocFlow utilizes large language models and retrieval-augmented generation (RAG) to assist developers. While we prioritize high indexing accuracy, artificial intelligence outputs may occasionally contain inaccuracies or incomplete reasoning. You agree to review and validate all code recommendations and documentation prior to production deployment.
                  </p>
                  <p>
                    <strong className="text-text-primary">Disclaimer of Warranties & Limitation of Liability:</strong> DocFlow is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind. To the maximum extent permitted by applicable law, DocFlow Inc. shall not be liable for any indirect, incidental, or consequential damages resulting from downtime, code vulnerabilities, or data loss.
                  </p>
                </div>
              </section>

              {/* 2. Privacy Notice */}
              <section id="privacy" aria-labelledby="privacy-heading" className="scroll-mt-28">
                <h2 id="privacy-heading" className="text-2xl font-bold text-text-primary mb-4">
                  2. Privacy Notice (GDPR & CCPA Compliant)
                </h2>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm">
                  <p>
                    DocFlow respects your privacy and adheres to the principles of data minimization and purpose limitation under GDPR (Regulation EU 2016/679) and CCPA.
                  </p>
                  <p>
                    <strong className="text-text-primary">Data We Collect:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Account details: Email address, username, optional name, and optional avatar image.</li>
                    <li>Authentication metadata: Passwords stored as one-way salted bcrypt hashes; OAuth tokens.</li>
                    <li>Connected Codebase Metadata: Repository URLs, branch names, commit hashes, AST schema definitions, and vector embeddings generated from code files.</li>
                    <li>Billing & Subscription status: PayPal transaction IDs and tier allocations (we do not process or store raw credit card numbers).</li>
                  </ul>
                  <p>
                    <strong className="text-text-primary">Sub-Processors:</strong> DocFlow engages trusted sub-processors under strict data processing agreements:
                  </p>
                  <div className="overflow-x-auto my-3">
                    <table className="w-full border border-surface-container text-xs text-left">
                      <thead className="bg-surface-variant">
                        <tr>
                          <th className="p-2.5 font-semibold text-text-primary">Sub-Processor</th>
                          <th className="p-2.5 font-semibold text-text-primary">Purpose</th>
                          <th className="p-2.5 font-semibold text-text-primary">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container">
                        <tr>
                          <td className="p-2.5 font-medium text-text-primary">OpenAI</td>
                          <td className="p-2.5">Text embeddings and LLM conversational reasoning</td>
                          <td className="p-2.5">United States</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-text-primary">PayPal</td>
                          <td className="p-2.5">Subscription billing and payment gateway</td>
                          <td className="p-2.5">United States / Global</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-text-primary">Cloudinary</td>
                          <td className="p-2.5">User profile avatar media storage</td>
                          <td className="p-2.5">United States</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-text-primary">GitHub</td>
                          <td className="p-2.5">OAuth authentication & repository access</td>
                          <td className="p-2.5">United States</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong className="text-text-primary">No Sale of Personal Data:</strong> We never sell, rent, or trade personal data or code repositories to third parties for advertising or profiling.
                  </p>
                </div>
              </section>

              {/* 3. Refund Policy */}
              <section id="refund" aria-labelledby="refund-heading" className="scroll-mt-28">
                <h2 id="refund-heading" className="text-2xl font-bold text-text-primary mb-4">
                  3. Refund & Cancellation Policy
                </h2>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm">
                  <p>
                    DocFlow offers transparent subscription billing for Pro ($20/month) and Premium ($75/month) tiers.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-text-primary">Cancel Anytime:</strong> You may cancel your subscription at any time directly through your account dashboard or your PayPal pre-approved payments dashboard. Upon cancellation, your access remains active until the end of your prepaid billing period.
                    </li>
                    <li>
                      <strong className="text-text-primary">14-Day Money-Back Guarantee (Statutory Withdrawal):</strong> If you are unsatisfied with your first subscription cycle or are an EU/UK consumer exercising statutory right of withdrawal, you may request a full refund within 14 days of your initial purchase date by emailing <a href="mailto:docflow.work@gmail.com" className="text-primary underline">docflow.work@gmail.com</a>.
                    </li>
                    <li>
                      <strong className="text-text-primary">Service Outages:</strong> In the unlikely event of continuous platform downtime exceeding our standard service expectations, prorated billing credits or refunds may be granted upon request.
                    </li>
                  </ul>
                </div>
              </section>

              {/* 4. Cookie Policy */}
              <section id="cookies" aria-labelledby="cookies-heading" className="scroll-mt-28">
                <h2 id="cookies-heading" className="text-2xl font-bold text-text-primary mb-4">
                  4. Cookie Policy
                </h2>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm">
                  <p>
                    DocFlow utilizes cookies and client storage strictly to operate our authenticated platform securely. Below is an itemized inventory of all cookies and browser storage keys:
                  </p>
                  <div className="overflow-x-auto my-3">
                    <table className="w-full border border-surface-container text-xs text-left">
                      <thead className="bg-surface-variant">
                        <tr>
                          <th className="p-2.5 font-semibold text-text-primary">Identifier</th>
                          <th className="p-2.5 font-semibold text-text-primary">Type</th>
                          <th className="p-2.5 font-semibold text-text-primary">Duration</th>
                          <th className="p-2.5 font-semibold text-text-primary">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container">
                        <tr>
                          <td className="p-2.5 font-mono text-primary font-medium">token</td>
                          <td className="p-2.5">HTTP-Only Cookie</td>
                          <td className="p-2.5">7 days</td>
                          <td className="p-2.5">Secure JWT authentication token for authorized session verification.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono text-primary font-medium">docflow_cookie_consent</td>
                          <td className="p-2.5">localStorage</td>
                          <td className="p-2.5">Persistent</td>
                          <td className="p-2.5">Remembers your cookie banner preference and consent acknowledgment.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    Because we do not deploy third-party advertising or cross-site tracking cookies, the cookies above are classified as <strong>Strictly Necessary</strong> for authentication and security under ePrivacy rules.
                  </p>
                </div>
              </section>

              {/* 5. Children's Privacy / Age Restrictions */}
              <section id="age-policy" aria-labelledby="age-heading" className="scroll-mt-28">
                <h2 id="age-heading" className="text-2xl font-bold text-text-primary mb-4">
                  5. Children&apos;s Privacy (COPPA & GDPR Art. 8)
                </h2>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm">
                  <p>
                    DocFlow is a professional codebase intelligence tool intended solely for developers, engineering teams, and adult business professionals.
                  </p>
                  <p>
                    We do not knowingly collect, solicit, or maintain personal information from individuals under the age of 18 (or under 16 within the European Economic Area). If you believe a minor has created an account without parental consent, please contact us at <a href="mailto:docflow.work@gmail.com" className="text-primary underline">docflow.work@gmail.com</a> and we will promptly delete all associated data.
                  </p>
                </div>
              </section>

              {/* 6. Data Deletion Request & User Rights */}
              <section id="rights" aria-labelledby="rights-heading" className="scroll-mt-28">
                <h2 id="rights-heading" className="text-2xl font-bold text-text-primary mb-4">
                  6. Data Deletion & Privacy Rights
                </h2>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm">
                  <p>
                    Under GDPR (Articles 15-22) and CCPA, you possess comprehensive rights over your personal data:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong className="text-text-primary">Right to Erasure (Right to be Forgotten):</strong> You have the right to request complete deletion of your account, repositories, vector embeddings, and chat history.</li>
                    <li><strong className="text-text-primary">Right of Access & Portability:</strong> You may request an exported copy of your account profile and connected data.</li>
                    <li><strong className="text-text-primary">Right to Rectification:</strong> You may correct or update your profile information anytime via user settings.</li>
                  </ul>
                  <p>
                    To initiate an account or data deletion request, send an email to{" "}
                    <a
                      href="mailto:docflow.work@gmail.com?subject=GDPR%20Data%20Deletion%20Request"
                      className="text-primary font-medium underline underline-offset-4 hover:text-emerald-700"
                    >
                      docflow.work@gmail.com
                    </a>{" "}
                    with the subject line &ldquo;GDPR Data Deletion Request&rdquo; from your registered email address. We verify identity and complete purge requests within 30 days in compliance with statutory deadlines.
                  </p>
                </div>
              </section>

              {/* 7. Business Details */}
              <section id="business" aria-labelledby="business-heading" className="scroll-mt-28">
                <h2 id="business-heading" className="text-2xl font-bold text-text-primary mb-4">
                  7. Business & Operator Details
                </h2>
                <div className="space-y-3 text-text-secondary leading-relaxed text-sm bg-surface-variant/70 border border-surface-container rounded-xl p-5">
                  <p><strong className="text-text-primary">Operating Entity:</strong> DocFlow Inc.</p>
                  <p><strong className="text-text-primary">Lead Maintainer:</strong> Omar Wael</p>
                  <p><strong className="text-text-primary">Official Contact:</strong> <a href="mailto:docflow.work@gmail.com" className="text-primary underline">docflow.work@gmail.com</a></p>
                  <p><strong className="text-text-primary">Repository:</strong> <a href="https://github.com/OmarAboelnaga121/DocFlow" target="_blank" rel="noopener noreferrer" className="text-primary underline">github.com/OmarAboelnaga121/DocFlow</a></p>
                  <p className="text-xs text-text-secondary/80">DocFlow is governed in accordance with international data protection principles and standard commercial e-commerce safeguards.</p>
                </div>
              </section>

              <div className="pt-6 border-t border-surface-container">
                <Link href="/" className="inline-flex items-center text-primary font-semibold hover:text-emerald-700 transition-colors">
                  <span aria-hidden="true">&larr;</span>
                  <span className="ml-2">Return to Home</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
