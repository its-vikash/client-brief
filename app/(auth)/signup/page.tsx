"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { signup } from "@/lib/auth";
import Spinner from "@/components/Spinner";
import PreConvaraLogo from "@/components/PreConvaraLogo";

const ROLES = [
  "Independent studio",
  "Freelance developer",
  "Freelance designer",
  "Small agency",
  "Other",
];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [role, setRole]             = useState("Independent studio");
  const [customRole, setCustomRole] = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())         { setError("Please enter your name."); return; }
    if (!email.trim())        { setError("Please enter your email."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPwd) { setError("Passwords do not match."); return; }

    const finalRole = role === "Other" ? (customRole.trim() || "Other") : role;
    setLoading(true); setError(null);

    const result = await signup(name.trim(), email.trim(), password, finalRole);
    if (!result.ok) { setError(result.error); setLoading(false); return; }
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
        Create your workspace
      </h1>
      <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
        Free to start. No card required.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Your name</label>
          <input type="text" value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            placeholder="Alex Weaver" disabled={loading} autoFocus
            autoComplete="name"
            className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
          <input type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="you@example.com" disabled={loading}
            autoComplete="email"
            className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Password</label>
          <div className="relative">
            <input type={showPwd ? "text" : "password"} autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="At least 6 characters" disabled={loading}
              className={inputClass} style={{ ...inputStyle, paddingRight: "2.75rem" }} />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity" tabIndex={-1}>
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Confirm password</label>
          <input type={showPwd ? "text" : "password"} autoComplete="new-password"
            value={confirmPwd}
            onChange={(e) => { setConfirmPwd(e.target.value); setError(null); }}
            placeholder="Re-enter your password" disabled={loading}
            className={inputClass}
            style={{ ...inputStyle, borderColor: confirmPwd && confirmPwd !== password ? "#FCA5A5" : undefined }} />
          {confirmPwd && confirmPwd !== password && (
            <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>Passwords don't match</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>I'm a…</label>
          <select value={role} onChange={(e) => { setRole(e.target.value); setError(null); }}
            disabled={loading} className={inputClass} style={inputStyle}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {role === "Other" && (
            <input type="text" value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="e.g. Marketing consultant" disabled={loading}
              className={inputClass + " mt-2"} style={inputStyle} />
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm"
            style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
          {loading ? <><Spinner size="sm" light />Creating account…</> : "Create account →"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--orange)" }}>Sign in</Link>
      </p>
      <p className="mt-3 text-sm text-center">
        <Link href="/" className="text-xs hover:underline opacity-50" style={{ color: "var(--text-secondary)" }}>
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
