import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-on-background px-6 md:px-8 pt-24 pb-16">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          Careers at DocFlow
        </h1>
        <p className="max-w-2xl text-center mb-8 text-text-secondary leading-relaxed">
          We&apos;re building the future of document intelligence. Join our team of passionate engineers, designers, and product thinkers.
          <br />
          <strong className="text-text-primary">Open positions coming soon.</strong>
        </p>
        <Link href="/" className="mt-4 text-secondary hover:text-white transition-colors">
          ← Back to Home
        </Link>
      </main>
      <Footer />
    </>
  );
}
