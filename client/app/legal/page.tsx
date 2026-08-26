import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0b1326] text-[#dae2fd] px-6 md:px-8">
      <h1 className="text-4xl font-bold mb-4" style={{ color: "#4edea3" }}>
        Legal
      </h1>
      <p className="max-w-2xl text-center mb-8">
        This site is provided as-is. All trademarks belong to their respective owners. Use of the service is governed by our Terms of Service and Privacy Policy.
      </p>
      <Link href="/" className="mt-4 text-[#4cd7f6] hover:text-white transition-colors">
        ← Back to Home
      </Link>
    </div>
  );
}
