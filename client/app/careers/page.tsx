import Link from "next/link";

export default function CareersPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0b1326] text-[#dae2fd] px-6 md:px-8">
      <h1 className="text-4xl font-bold mb-4" style={{ color: "#4edea3" }}>
        Careers at DocFlow
      </h1>
      <p className="max-w-2xl text-center mb-8">
        We're building the future of document intelligence. Join our team of passionate engineers, designers, and product thinkers.
        <br />
        <strong>Open positions coming soon.</strong>
      </p>
      <Link href="/" className="mt-4 text-[#4cd7f6] hover:text-white transition-colors">
        ← Back to Home
      </Link>
    </div>
  );
}
