import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />

      <main className="min-h-[calc(100vh-140px)] pt-24 pb-16 px-6 md:px-8 flex items-center justify-center relative overflow-hidden">
        {/* Background radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] pointer-events-none rounded-full blur-[120px] -z-10"
          style={{
            background:
              "radial-gradient(circle, rgba(78, 222, 163, 0.12) 0%, rgba(76, 215, 246, 0.05) 50%, transparent 70%)",
          }}
        />

        <div className="max-w-2xl w-full mx-auto text-center flex flex-col items-center">
          {/* Large Error Code */}
          <h1
            className="text-7xl md:text-9xl font-mono font-bold tracking-tighter mb-4 select-none"
            style={{
              background: "linear-gradient(180deg, #f8fafc 0%, rgba(148, 163, 184, 0.3) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            404
          </h1>

          {/* Title & Subtitle */}
          <h2
            className="text-2xl md:text-3xl font-semibold tracking-tight mb-3"
            style={{ color: "#f8fafc" }}
          >
            Lost in the Codebase
          </h2>
          <p
            className="text-base md:text-lg max-w-md mx-auto mb-8 leading-relaxed"
            style={{ color: "#94a3b8" }}
          >
            The AST node or endpoint you requested couldn't be resolved in this repository.
          </p>

          {/* Interactive / Visual Terminal Card */}
          <div
            className="w-full max-w-lg mb-8 rounded-lg text-left overflow-hidden shadow-2xl"
            style={{
              background: "#060e20",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              <span className="ml-2 font-mono text-[11px] text-[#94a3b8]">docflow-query.log</span>
            </div>
            <div className="p-4 font-mono text-xs md:text-sm space-y-1.5">
              <p className="text-[#94a3b8]">
                <span className="text-[#4edea3]">$</span> docflow resolve --path current_url
              </p>
              <p className="text-[#ffb4ab]">
                [Error]: Target path not found in index registry.
              </p>
              <p className="text-[#4cd7f6]/80 text-[11px] pt-1">
                Suggested remedy: Return to index root or consult documentation.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold text-sm transition-all hover:opacity-95 shadow-lg cursor-pointer"
              style={{
                background: "#10b981",
                color: "#0f172a",
              }}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Home
            </Link>
            <Link
              href="/login"
              className="cursor-pointer w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium text-sm transition-all hover:bg-white/10 cursor-pointer"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#f8fafc",
              }}
            >
              Log In to Workspace
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
