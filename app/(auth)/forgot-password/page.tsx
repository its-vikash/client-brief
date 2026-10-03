"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Mail } from "lucide-react";
import { resetPassword, isValidEmail } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import Spinner from "@/components/Spinner";
import PreConvaraLogo from "@/components/PreConvaraLogo";

// ── Two distinct flows depending on backend ───────────────────────────────────
// Supabase: real password reset email (one-step)
// localStorage: change password by verifying current password (two-field form)

export default function ForgotPasswordPage() {
  const router = useRouter();
  const useSupabase = isSupabaseConfigured();

  // Shared
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState<"form" | "email_sent" | "change_done">("form");

  // localStorage-only fields
  const [oldPwd, setOldPwd]         = useState("");
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOld, setShowOld]       = useState(false);
  const [showNew, setShowNew]       = useState(false);

  // ── Supabase flow — send reset email ────────────────────────────────────────
  async function handleSupabaseReset(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    setError(null);

    const { supabase } = await import("@/lib/supabase");
    const { error: sbErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);
    if (sbErr) { setError("Could not send reset email. Please try again."); return; }
    setStep("email_sent");
  }

  // ── localStorage flow — verify old password then set new one ────────────────
  async function handleLocalReset(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email))      { setError("Please enter your email address."); return; }
    if (!oldPwd)                   { setError("Please enter your current password."); return; }
    if (newPwd.length < 6)         { setError("New password must be at least 6 characters."); return; }
    if (newPwd !== confirmPwd)     { setError("New passwords do not match."); return; }

    setLoading(true);
    setError(null);
    const result = await resetPassword(email.trim(), oldPwd, newPwd);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    setStep("change_done");
  }

  // handleStartFresh removed — wipeAndReset was destructive and caused data loss

  const inputClass =
    "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#E8652A]/40";
  const inputStyle = {
    backgroundColor: "#fff",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  // ── Success: email sent ──────────────────────────────────────────────────────
  if (step === "email_sent") {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "#EFF6FF" }}>
          <Mail className="w-7 h-7" style={{ color: "#2563EB" }} />
        </div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
          Check your inbox
        </h1>
        <p className="text-sm mb-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          We've sent a password reset link to{" "}
          <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
        </p>
        <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>
          The link expires in 1 hour. Check your spam folder if you don't see it.
        </p>
        <Link href="/login"
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: "var(--teal-dark)", color: "var(--text-cream)" }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  // ── Success: password changed ────────────────────────────────────────────────
  if (step === "change_done") {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "#E8F5E4" }}>
          <CheckCircle2 className="w-7 h-7" style={{ color: "#2D7A3A" }} />
        </div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
          Password updated
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          Your password has been changed. You can now sign in with your new password.
        </p>
        <Link href="/login"
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: "var(--teal-dark)", color: "var(--text-cream)" }}>
          Sign in →
        </Link>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/"><PreConvaraLogo size={36} /></Link>
      </div>

      <h1 className="text-2xl font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
        Forgot your password?
      </h1>
      <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
        {useSupabase
          ? "Enter your email and we'll send you a reset link."
          : "Enter your email and current password to set a new one."}
      </p>

      {/* ── Supabase: single email field ── */}
      {useSupabase ? (
        <form onSubmit={handleSupabaseReset} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Email address
            </label>
            <input type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="you@example.com" autoFocus disabled={loading}
              className={inputClass} style={inputStyle} />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm"
              style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
            {loading ? <><Spinner size="sm" light />Sending…</> : "Send reset link"}
          </button>
        </form>

      ) : (
        /* ── localStorage: email + old password + new password ── */
        <form onSubmit={handleLocalReset} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Email
            </label>
            <input type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="you@example.com" autoFocus disabled={loading}
              className={inputClass} style={inputStyle} />
          </div>

          {/* Current password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Current password
            </label>
            <div className="relative">
              <input type={showOld ? "text" : "password"} value={oldPwd}
                autoComplete="current-password"
                onChange={(e) => { setOldPwd(e.target.value); setError(null); }}
                placeholder="Your current password" disabled={loading}
                className={inputClass} style={{ ...inputStyle, paddingRight: "2.75rem" }} />
              <button type="button" onClick={() => setShowOld(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity" tabIndex={-1}>
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              New password
            </label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={newPwd}
                autoComplete="new-password"
                onChange={(e) => { setNewPwd(e.target.value); setError(null); }}
                placeholder="At least 6 characters" disabled={loading}
                className={inputClass} style={{ ...inputStyle, paddingRight: "2.75rem" }} />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity" tabIndex={-1}>
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Confirm new password
            </label>
            <input type={showNew ? "text" : "password"} value={confirmPwd}
              autoComplete="new-password"
              onChange={(e) => { setConfirmPwd(e.target.value); setError(null); }}
              placeholder="Re-enter new password" disabled={loading}
              className={inputClass}
              style={{
                ...inputStyle,
                borderColor: confirmPwd && confirmPwd !== newPwd ? "#FCA5A5" : undefined,
              }} />
            {confirmPwd && confirmPwd !== newPwd && (
              <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>Passwords don't match</p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm"
              style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
            {loading ? <><Spinner size="sm" light />Updating…</> : "Update password"}
          </button>
        </form>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
      </div>

      {/* Truly locked out — safe option (no data destruction) */}
      {!useSupabase && (
        <div className="rounded-2xl p-4"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            Completely locked out?
          </p>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            If you can't remember your password and your account data is gone, contact us —
            we can help you recover without losing your briefs.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            style={{ color: "var(--orange)" }}
          >
            Contact support →
          </Link>
          <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
            Or{" "}
            <Link href="/signup" className="underline hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
              create a new account
            </Link>{" "}
            with a different email address to start fresh without losing access to your existing account.
          </p>
        </div>
      )}

      <p className="mt-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
        Remember it?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--orange)" }}>
          Sign in
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
