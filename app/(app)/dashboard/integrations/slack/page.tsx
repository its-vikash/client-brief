"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, Hash, CheckCircle2, AlertCircle, ExternalLink,
  Copy, Check, Send, Zap,
} from "lucide-react";
import Spinner from "@/components/Spinner";
import { getBriefHistory } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import type { BriefRecord } from "@/types";

const inputStyle = { backgroundColor: "var(--bg-card-alt)", border: "1px solid var(--border)", color: "var(--text-primary)" };
const inputClass = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#EE8953]/40";

const SETUP_STEPS = [
  { n: "1", title: "Create a Slack App", desc: 'Go to api.slack.com/apps → Create New App → From scratch. Name it "PreConvara".' },
  { n: "2", title: "Add chat:write scope", desc: "Under OAuth & Permissions → Scopes → Bot Token Scopes → Add chat:write." },
  { n: "3", title: "Install to workspace", desc: "Under OAuth & Permissions → Install to Workspace → Allow. Copy the Bot User OAuth Token (starts with xoxb-)." },
  {
    n: "4", title: "Add to .env.local", desc: "Add both variables below to your .env.local, then restart the dev server.",
    snippets: [
      "SLACK_BOT_TOKEN=xoxb-your-token-here",
      "SLACK_DEFAULT_CHANNEL=#your-channel-name",
    ],
  },
];

export default function SlackPage() {
  const [briefs,       setBriefs]       = useState<BriefRecord[]>([]);
  const [selectedId,   setSelectedId]   = useState("");
  const [channelOverride, setChannelOverride] = useState("");
  const [sending,      setSending]      = useState(false);
  const [success,      setSuccess]      = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [defaultChannel, setDefaultChannel] = useState<string | null>(null);
  const [copiedIdx,    setCopiedIdx]    = useState<number | null>(null);

  // ── Load status and briefs ─────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    // Use the dedicated status endpoint — no false negatives from error responses
    try {
      const res  = await fetch("/api/integrations/slack/status");
      const data = await res.json();
      setIsConfigured(data.configured === true);
      setDefaultChannel(data.channel ?? null);
    } catch {
      setIsConfigured(false);
    }

    const user = getCurrentUser();
    if (!user) return;
    const records = await getBriefHistory(user.id);
    const ready   = records.filter((r) => r.status === "ready" && r.brief);
    setBriefs(ready);
    if (ready.length > 0) setSelectedId(ready[0].id);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedBrief = briefs.find((b) => b.id === selectedId);

  // ── Normalise channel name ─────────────────────────────────────────────────
  function normaliseChannel(raw: string): string {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return "";
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  }

  // ── Send ───────────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!selectedBrief?.brief) return;
    setSending(true); setError(null); setSuccess(null);
    try {
      const channel = channelOverride.trim()
        ? normaliseChannel(channelOverride)
        : undefined;

      const res = await fetch("/api/integrations/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefTitle:   selectedBrief.input.companyName,
          briefSummary: selectedBrief.brief.companyOverview ?? "",
          companyName:  selectedBrief.input.companyName,
          service:      selectedBrief.input.service,
          keyPoints:    selectedBrief.brief.keyTalkingPoints ?? [],
          actionItems:  selectedBrief.brief.informationStillMissing ?? [],
          channel,
          briefUrl: `${window.location.origin}/dashboard/brief/${selectedBrief.id}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? "Send failed."); return; }
      setSuccess(`✓ Sent to ${data.channel}`);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setSending(false); }
  }

  async function copySnippet(text: string, i: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2500);
  }

  return (
    <div className="min-h-full px-4 sm:px-10 py-8 max-w-4xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-7 opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: "var(--text-secondary)" }}>
        <ChevronLeft className="w-4 h-4" /> Back to overview
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shrink-0"
            style={{ backgroundColor: "#4A154B" }}>S</div>
          <div>
            <p className="label-eyebrow" style={{ color: "var(--text-muted)" }}>Integration</p>
            <h1 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800, color: "var(--text-primary)" }}>
              Slack
            </h1>
          </div>

          {/* Status badge */}
          {isConfigured === null && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              <Spinner size="sm" /> Checking…
            </span>
          )}
          {isConfigured === true && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: "#E8F5E4", color: "#2D7A3A" }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected{defaultChannel ? ` · ${defaultChannel}` : ""}
            </span>
          )}
          {isConfigured === false && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: "#FEF9C3", color: "#854D0E" }}>
              <AlertCircle className="w-3.5 h-3.5" />
              Not configured
            </span>
          )}
        </div>
        <p className="text-sm max-w-xl" style={{ color: "var(--text-secondary)" }}>
          Send AI-generated brief summaries to any Slack channel or DM. Stay informed without leaving where you work.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Left — Setup guide (collapsed when configured) */}
        <div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage),sans-serif" }}>
                  {isConfigured ? "✓ Setup complete" : "Setup Guide"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {isConfigured ? "Your Slack bot token is active." : "One-time setup — about 5 minutes"}
                </p>
              </div>
              {isConfigured && (
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#2D7A3A" }} />
              )}
            </div>

            {!isConfigured && (
              <div className="divide-y" style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-light)" }}>
                {SETUP_STEPS.map(({ n, title, desc, snippets }, i) => (
                  <div key={n} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ backgroundColor: "#4A154B", color: "#fff" }}>{n}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{title}</p>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                        {snippets && (
                          <div className="mt-2 space-y-1.5">
                            {snippets.map((line, j) => {
                              const idx = i * 10 + j;
                              return (
                                <div key={j} className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                                  style={{ backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-light)" }}>
                                  <code className="flex-1 text-xs truncate"
                                    style={{ fontFamily: "var(--font-space-mono),monospace", color: "var(--teal)" }}>
                                    {line}
                                  </code>
                                  <button onClick={() => copySnippet(line, idx)}
                                    className="shrink-0 opacity-40 hover:opacity-80 transition-opacity">
                                    {copiedIdx === idx
                                      ? <Check className="w-3.5 h-3.5" style={{ color: "#2D7A3A" }} />
                                      : <Copy className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 border-t flex items-center justify-between"
              style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}>
              <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                style={{ color: "#4A154B" }}>
                Slack API Dashboard <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {isConfigured === false && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Restart server after adding env vars
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right — Send panel */}
        <div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
            <div className="px-5 py-4 border-b"
              style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage),sans-serif" }}>
                Send a Brief to Slack
              </p>
              {defaultChannel && isConfigured && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Default channel: <span className="font-mono">{defaultChannel}</span>
                </p>
              )}
            </div>

            <div className="p-5 space-y-4" style={{ backgroundColor: "var(--bg-card-alt)" }}>
              {/* Brief selector */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Select brief
                </label>
                {briefs.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No ready briefs yet.{" "}
                    <Link href="/dashboard/create" style={{ color: "var(--orange)" }} className="underline">
                      Create one →
                    </Link>
                  </p>
                ) : (
                  <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                    className={inputClass} style={inputStyle}>
                    {briefs.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.input.companyName} — {b.input.service.split("(")[0].trim()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Channel override */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Send to channel{" "}
                  <span className="font-normal opacity-60">(leave blank to use default)</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40"
                    style={{ color: "var(--text-secondary)" }} />
                  <input type="text" value={channelOverride}
                    onChange={(e) => setChannelOverride(e.target.value)}
                    placeholder={defaultChannel?.replace("#", "") ?? "general"}
                    className={inputClass}
                    style={{ ...inputStyle, paddingLeft: "2.25rem" }} />
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  No # needed — we add it automatically.
                </p>
              </div>

              {/* Preview */}
              {selectedBrief?.brief && (
                <div className="rounded-xl p-3"
                  style={{ backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-light)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: "var(--text-muted)" }}>Preview</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--text-primary)" }}>{selectedBrief.input.companyName}</strong>
                    {" · "}{selectedBrief.input.service.split("(")[0].trim()}
                    <br />
                    {selectedBrief.brief.companyOverview?.slice(0, 120)}…
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm"
                  style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p>{error}</p>
                    {error.toLowerCase().includes("channel_not_found") && (
                      <p className="mt-1 text-xs opacity-80">
                        Make sure the channel exists and the bot is invited: <code>/invite @PreConvara</code>
                      </p>
                    )}
                    {error.toLowerCase().includes("not_in_channel") && (
                      <p className="mt-1 text-xs opacity-80">
                        Invite the bot to the channel first: <code>/invite @PreConvara</code>
                      </p>
                    )}
                    {error.toLowerCase().includes("not configured") && (
                      <p className="mt-1 text-xs opacity-80">
                        Add <code>SLACK_BOT_TOKEN</code> to .env.local and restart the server.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm"
                  style={{ backgroundColor: "#E8F5E4", color: "#2D7A3A" }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending || !selectedBrief || isConfigured !== true}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#4A154B", color: "#fff" }}
              >
                {sending
                  ? <><Spinner size="sm" light />Sending…</>
                  : <><Send className="w-4 h-4" />Send to Slack</>
                }
              </button>

              {isConfigured === false && (
                <div className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-light)" }}>
                  <Zap className="w-4 h-4 mx-auto mb-1.5" style={{ color: "var(--orange)" }} />
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Complete the setup guide, add env vars, and restart the dev server to enable sending.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
