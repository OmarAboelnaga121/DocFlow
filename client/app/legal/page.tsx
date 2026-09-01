import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LegalPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-on-background px-6 md:px-8 pt-24 pb-16">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          Legal
        </h1>
        <p className="max-w-2xl text-center mb-8 text-text-secondary leading-relaxed">
          This site is provided as-is. All trademarks belong to their respective owners. Use of the service is governed by our Terms of Service and Privacy Policy.
        </p>
        <Link href="/" className="mt-4 text-secondary hover:text-white transition-colors">
          ← Back to Home
        </Link>
      </main>
      <Footer />
    </>
  );
}
