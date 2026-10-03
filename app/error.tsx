"use client";

import { useEffect } from "react";
import Link from "next/link";
import PreConvaraLogo from "@/components/PreConvaraLogo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PreConvara] Runtime error:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg-canvas)" }}
    >
      {/* Background blobs */}
      <div className="absolute top-[10%] right-[5%] w-72 h-72 rounded-full pointer-events-none"
        style={{ backgroundColor: "var(--orange)", opacity: 0.07, filter: "blur(80px)" }} />
      <div className="absolute bottom-[10%] left-[5%] w-80 h-80 rounded-full pointer-events-none"
        style={{ backgroundColor: "var(--teal)", opacity: 0.07, filter: "blur(100px)" }} />

      <div className="relative text-center max-w-lg mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/"><PreConvaraLogo size={36} /></Link>
        </div>

        {/* Icon */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#FEF3C7" }}
        >
          <span style={{ fontSize: "2.5rem" }}>⚠️</span>
        </div>

        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-3"
          style={{ fontFamily: "var(--font-bricolage), sans-serif", color: "var(--text-primary)" }}
        >
          Something went wrong
        </h1>
        <p
          className="text-sm leading-relaxed mb-8 max-w-sm mx-auto"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          An unexpected error occurred. Your data is safe — this is a display problem,
          not a data problem. Try refreshing, or go back to the dashboard.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg"
            style={{ backgroundColor: "var(--orange)", color: "#fff" }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
            style={{
              backgroundColor: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            Go to dashboard
          </Link>
        </div>

        {/* Error digest for support */}
        {error.digest && (
          <p className="mt-6 text-xs font-mono opacity-40" style={{ color: "var(--text-muted)" }}>
            Error reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
