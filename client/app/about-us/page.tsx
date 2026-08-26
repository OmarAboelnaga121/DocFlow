import Link from "next/link";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0b1326] text-[#dae2fd] px-6 md:px-8">
      <h1 className="text-4xl font-bold mb-4" style={{ color: "#4edea3" }}>
        About DocFlow
      </h1>
      <p className="max-w-2xl text-center mb-8">
        DocFlow is a modern document management platform that empowers product teams with intelligent codebase insights.
        Our mission is to accelerate development by providing powerful search, analytics, and collaboration tools.
      </p>
      <p className="text-sm mb-4">Created by Omar Wael – passionate about building developer‑first experiences.</p>
      <Link href="/" className="mt-4 text-[#4cd7f6] hover:text-white transition-colors">
        ← Back to Home
      </Link>
    </div>
  );
}
