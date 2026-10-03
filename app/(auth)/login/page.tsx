"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/auth";
import Spinner from "@/components/Spinner";
import PreConvaraLogo from "@/components/PreConvaraLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);

    const result = await login(email.trim(), password);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
  }

  const inputClass =
    "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#EE8953]/40";
  const inputStyle = {
    backgroundColor: "#fff",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/"><PreConvaraLogo size={36} /></Link>
      </div>

      <h1 className="text-2xl font-extrabold mb-1"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage), sans-serif" }}>
        Welcome back
      </h1>
      <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
        Sign in to your workspace.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Email
          </label>
          <input type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="you@example.com" disabled={loading} autoFocus
            autoComplete="email"
            className={inputClass} style={inputStyle} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Password</label>
            <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: "var(--orange)" }}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="••••••••"
              disabled={loading}
              className={inputClass}
              style={{ ...inputStyle, paddingRight: "2.75rem" }}
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity"
              tabIndex={-1}>
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm"
            style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p>{error}</p>
              {error.toLowerCase().includes("incorrect") && (
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "#7A1200" }}>
                  If you signed up recently and can't log in, your account data may have been cleared from this browser.{" "}
                  <Link href="/signup" className="underline font-semibold">Create a new account</Link>{" "}
                  or{" "}
                  <Link href="/forgot-password" className="underline font-semibold">reset your password</Link>{" "}
                  if you know your current one.
                </p>
              )}
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--teal-dark)", color: "var(--text-cream)" }}>
          {loading ? <><Spinner size="sm" light />Signing in…</> : "Sign in →"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
        Don't have an account?{" "}
        <Link href="/signup" className="font-semibold hover:underline" style={{ color: "var(--orange)" }}>
          Create one free
        </Link>
      </p>
      <p className="mt-3 text-sm text-center">
        <Link href="/" className="text-xs hover:underline opacity-50" style={{ color: "var(--text-secondary)" }}>
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
