import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-on-background px-6 md:px-8 pt-24 pb-16">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          Contact Us
        </h1>
        <p className="max-w-2xl text-center mb-8 text-text-secondary leading-relaxed">
          Have questions or feedback? Reach out via email at
          <a href="mailto:support@docflow.com" className="ml-2 text-secondary hover:underline">
            support@docflow.com
          </a>.
        </p>
        <Link href="/" className="mt-4 text-secondary hover:text-white transition-colors">
          ← Back to Home
        </Link>
      </main>
      <Footer />
    </>
  );
}
