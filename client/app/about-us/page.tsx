import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutUsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-on-background px-6 md:px-8 pt-24 pb-16">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          About DocFlow
        </h1>
        <p className="max-w-2xl text-center mb-6 text-text-secondary leading-relaxed">
          DocFlow is a modern document management platform that empowers product teams with intelligent codebase insights.
          Our mission is to accelerate development by providing powerful search, analytics, and collaboration tools.
        </p>
        <p className="text-sm mb-6 text-on-surface-variant">
          Created by Omar Wael – passionate about building developer‑first experiences.
        </p>
        <Link href="/" className="mt-2 text-secondary hover:text-white transition-colors">
          ← Back to Home
        </Link>
      </main>
      <Footer />
    </>
  );
}
