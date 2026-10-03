"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, Mail, ExternalLink, Copy, Check,
  AlertCircle, Search, CheckCircle2, Unlink, LogIn, Zap,
} from "lucide-react";
import Spinner from "@/components/Spinner";

const inputStyle = { backgroundColor: "var(--bg-card-alt)", border: "1px solid var(--border)", color: "var(--text-primary)" };
const inputClass = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#EE8953]/40";

const ENV_VARS = [
  "GOOGLE_CLIENT_ID=your_google_client_id_here",
  "GOOGLE_CLIENT_SECRET=your_google_client_secret_here",
  "GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/gmail/callback",
];

interface EmailThread {
  id: string; subject: string; snippet: string; summary: string; date: string;
}

interface StatusResult {
  configured:      boolean;
  tokenValid:      boolean;
  tokenExpiresAt:  number | null;
}

export default function GmailPage() {
  const [status,      setStatus]      = useState<StatusResult | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [threads,     setThreads]     = useState<EmailThread[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [copiedIdx,   setCopiedIdx]   = useState<number | null>(null);

  // ── Load status ─────────────────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    try {
      const res  = await fetch("/api/integrations/gmail/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ configured: false, tokenValid: false, tokenExpiresAt: null });
    }
  }, []);

  useEffect(() => {
    loadStatus();
    // Also check URL params in case we just completed OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      loadStatus();
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("error")) {
      const errCode = params.get("error") ?? "";
      if (errCode === "access_denied") {
        setError("Access denied. You may have cancelled the sign-in, or your Google Cloud app is set to 'Internal'. See the fix below.");
      } else {
        setError(`OAuth failed (${errCode}). Please try connecting again.`);
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [loadStatus]);

  // ── Connect Gmail → triggers OAuth flow ────────────────────────────────────
  function handleConnect() {
    window.location.href = "/api/integrations/gmail";
  }

  // ── Disconnect ─────────────────────────────────────────────────────────────
  async function handleDisconnect() {
    // Delete the cookie by expiring it
    window.document.cookie = "gmail_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    await loadStatus();
    setThreads([]);
    setError(null);
  }

  // ── Fetch email threads ─────────────────────────────────────────────────────
  async function handleFetch() {
    if (!companyName.trim()) { setError("Enter a company name to search."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/integrations/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Access token is read server-side from the HTTP-only cookie
        body: JSON.stringify({ accessToken: "from_cookie", companyName }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.error?.includes("expired") || res.status === 401) {
          setError("Your Gmail session has expired. Please reconnect.");
          setStatus((s) => s ? { ...s, tokenValid: false } : s);
        } else {
          setError(data.error ?? "Failed to fetch emails.");
        }
        return;
      }
      setThreads(data.threads ?? []);
      if ((data.threads ?? []).length === 0) setError(`No emails found for "${companyName}". Try a different search term.`);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function copySnippet(text: string, i: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2500);
  }

  const isConfigured = status?.configured === true;
  const isConnected  = status?.tokenValid  === true;

  return (
    <div className="min-h-full px-4 sm:px-10 py-8 max-w-4xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-7 opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: "var(--text-secondary)" }}>
        <ChevronLeft className="w-4 h-4" /> Back to overview
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#EA4335,#FBBC05,#34A853,#4285F4)" }}>
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="label-eyebrow" style={{ color: "var(--text-muted)" }}>Integration</p>
            <h1 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800, color: "var(--text-primary)" }}>
              Gmail
            </h1>
          </div>

          {/* Status */}
          {status === null && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              <Spinner size="sm" /> Checking…
            </span>
          )}
          {status !== null && !isConfigured && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: "#FEF9C3", color: "#854D0E" }}>
              <AlertCircle className="w-3.5 h-3.5" /> Not configured
            </span>
          )}
          {isConfigured && !isConnected && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
              <Zap className="w-3.5 h-3.5" /> Ready — not connected
            </span>
          )}
          {isConnected && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: "#E8F5E4", color: "#2D7A3A" }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          )}
        </div>
        <p className="text-sm max-w-xl" style={{ color: "var(--text-secondary)" }}>
          Pull past email threads from Gmail and get AI-generated summaries — so you walk into every call knowing exactly what was discussed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Left — Setup / Connect */}
        <div className="space-y-4">

          {/* Step 1: Configure env vars */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
            <div className="px-5 py-4 border-b flex items-center gap-3"
              style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: isConfigured ? "#2D7A3A" : "linear-gradient(135deg,#EA4335,#4285F4)",
                  color: "#fff",
                }}>
                {isConfigured ? "✓" : "1"}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage),sans-serif" }}>
                  {isConfigured ? "OAuth credentials configured" : "Add OAuth credentials"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {isConfigured
                    ? "Your Google Client ID and Secret are set."
                    : "Go to console.cloud.google.com → Enable Gmail API → Create OAuth credentials"}
                </p>
              </div>
            </div>

              {!isConfigured && (
                <div className="px-5 py-4 space-y-4" style={{ backgroundColor: "var(--bg-card-alt)" }}>
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                      Your current .env.local already has these — they just need to match a Google project with Gmail API enabled:
                    </p>
                    <div className="space-y-1.5">
                      {ENV_VARS.map((line, j) => (
                        <div key={j} className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                          style={{ backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-light)" }}>
                          <code className="flex-1 text-[11px] truncate"
                            style={{ fontFamily: "var(--font-space-mono),monospace", color: "var(--teal)" }}>
                            {line}
                          </code>
                          <button onClick={() => copySnippet(line, j)}
                            className="shrink-0 opacity-40 hover:opacity-80 transition-opacity">
                            {copiedIdx === j
                              ? <Check className="w-3.5 h-3.5" style={{ color: "#2D7A3A" }} />
                              : <Copy className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                      style={{ color: "#4285F4" }}>
                      Google Cloud Console <ExternalLink className="w-3 h-3" />
                    </a>
                    <a href="https://developers.google.com/gmail/api/quickstart/js" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs hover:underline"
                      style={{ color: "var(--text-muted)" }}>
                      Gmail API Quickstart <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
          </div>

          {/* Step 2: Connect account */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
            <div className="px-5 py-4 border-b flex items-center gap-3"
              style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: isConnected ? "#2D7A3A" : isConfigured ? "#4285F4" : "var(--border)",
                  color: "#fff",
                }}>
                {isConnected ? "✓" : "2"}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage),sans-serif" }}>
                  {isConnected ? "Gmail connected" : "Connect your Gmail account"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {isConnected
                    ? "OAuth session is active. You can pull email threads."
                    : "Click below to authorise read-only access to your Gmail."}
                </p>
              </div>
            </div>
            <div className="px-5 py-4" style={{ backgroundColor: "var(--bg-card-alt)" }}>
              {isConnected ? (
                <button onClick={handleDisconnect}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  <Unlink className="w-4 h-4" /> Disconnect Gmail
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={!isConfigured}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#EA4335,#4285F4)", color: "#fff" }}>
                  <LogIn className="w-4 h-4" />
                  {isConfigured ? "Connect Gmail" : "Configure env vars first"}
                </button>
              )}
              {!isConfigured && (
                <p className="mt-2 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Add your Google credentials to .env.local and restart the dev server.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right — Search */}
        <div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
            <div className="px-5 py-4 border-b"
              style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage),sans-serif" }}>
                Pull Email Threads
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Search your Gmail for threads related to a company or contact.
              </p>
            </div>

            <div className="p-5 space-y-4" style={{ backgroundColor: "var(--bg-card-alt)" }}>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Company or contact name
                </label>
                <input type="text" value={companyName}
                  onChange={(e) => { setCompanyName(e.target.value); setError(null); }}
                  placeholder="e.g. Northstar Studio"
                  onKeyDown={(e) => { if (e.key === "Enter") handleFetch(); }}
                  className={inputClass} style={inputStyle} />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm"
                  style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button onClick={handleFetch}
                disabled={loading || !isConnected || !companyName.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#EA4335,#4285F4)", color: "#fff" }}>
                {loading
                  ? <><Spinner size="sm" light />Fetching…</>
                  : <><Search className="w-4 h-4" />Search Gmail</>
                }
              </button>

              {!isConnected && isConfigured && (
                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Connect your Gmail account (Step 2) to enable searching.
                </p>
              )}
            </div>

            {/* Results */}
            {threads.length > 0 && (
              <div className="border-t divide-y" style={{ borderColor: "var(--border-light)" }}>
                {threads.map((t) => (
                  <div key={t.id} className="px-5 py-4" style={{ backgroundColor: "var(--bg-card-alt)" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                        {t.subject}
                      </p>
                      <span className="text-[10px] shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {t.date}
                      </span>
                    </div>
                    <div className="rounded-lg p-3"
                      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: "var(--text-muted)" }}>AI Summary</p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {t.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
