"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft, Upload, FileText, Copy, Check, Download,
  AlertCircle, Users, CheckCircle2, HelpCircle, ArrowRight,
  TrendingUp, Sparkles, X,
} from "lucide-react";
import Spinner from "@/components/Spinner";
import type { SummarizeResponse } from "@/app/api/summarize/route";

const inputStyle = { backgroundColor: "var(--bg-card-alt)", border: "1px solid var(--border)", color: "var(--text-primary)" };

// ── Sentiment badge ───────────────────────────────────────────────────────────
function SentimentBadge({ s }: { s: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Positive: { bg: "#E8F5E4", color: "#2D7A3A" },
    Mixed:    { bg: "#FEF9C3", color: "#854D0E" },
    Neutral:  { bg: "var(--bg-card)", color: "var(--text-muted)" },
    Tense:    { bg: "#FDECEA", color: "#B91C1C" },
  };
  const style = map[s] ?? map.Neutral;
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={style}>{s}</span>
  );
}

export default function TranscriptsPage() {
  const [text,       setText]       = useState("");
  const [filename,   setFilename]   = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState<SummarizeResponse | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── File upload handler ────────────────────────────────────────────────────
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const content = await file.text();
    setText(content);
    setResult(null); setError(null);
  }

  function clearFile() {
    setText(""); setFilename(null); setResult(null); setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Summarise ──────────────────────────────────────────────────────────────
  async function handleSummarise() {
    if (!text.trim()) { setError("Please paste or upload a transcript first."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, filename: filename ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? "Summarisation failed."); return; }
      setResult(data as SummarizeResponse);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  // ── Copy as text ──────────────────────────────────────────────────────────
  async function handleCopy() {
    if (!result) return;
    const lines = [
      `# ${result.title}`,
      `Type: ${result.type}${result.date ? ` · ${result.date}` : ""}`,
      `Participants: ${result.participants.join(", ") || "Not specified"}`,
      "",
      "## Executive Summary",
      result.executiveSummary,
      "",
      "## Key Points",
      ...result.keyPoints.map((p) => `• ${p}`),
      "",
      "## Decisions",
      ...result.decisions.map((d) => `✓ ${d}`),
      "",
      "## Action Items",
      ...result.actionItems.map((a) => `→ ${a.task}${a.owner ? ` (${a.owner})` : ""}${a.dueDate ? ` — due ${a.dueDate}` : ""}`),
      "",
      "## Open Questions",
      ...result.openQuestions.map((q) => `? ${q}`),
      "",
      "## Next Steps",
      result.nextSteps,
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="min-h-full px-4 sm:px-10 py-8 max-w-5xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-7 opacity-50 hover:opacity-100 transition-opacity anim-fade-in"
        style={{ color: "var(--text-secondary)" }}>
        <ChevronLeft className="w-4 h-4" /> Back to overview
      </Link>

      <div className="mb-8 anim-fade-up">
        <p className="label-eyebrow mb-3">Transcripts</p>
        <h1 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, lineHeight: 1.1, color: "var(--text-primary)" }}>
          Upload transcripts,<br /><span style={{ color: "var(--orange)" }}>get structured insights.</span>
        </h1>
        <p className="mt-3 text-sm max-w-lg" style={{ color: "var(--text-secondary)" }}>
          Paste a meeting transcript, interview, or any document. PreConvara extracts key points, decisions, action items, and open questions automatically.
        </p>
      </div>

      {!result ? (
        <div className="max-w-2xl space-y-5 anim-fade-up-1">
          {/* Upload area */}
          <div
            className="rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer hover:opacity-80"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".txt,.md,.csv,.srt,.vtt" className="hidden" onChange={handleFile} />
            {filename ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-5 h-5" style={{ color: "var(--teal)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{filename}</span>
                <button onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="p-1 rounded-lg hover:opacity-60 transition-opacity"
                  style={{ color: "var(--text-muted)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: "var(--text-secondary)" }} />
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Drop a file or click to upload</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>.txt · .md · .csv · .srt · .vtt</p>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>or paste directly</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
          </div>

          {/* Text area */}
          <div>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null); setResult(null); }}
              placeholder={"[00:00] Speaker 1: Welcome everyone, let's get started...\n[00:05] Speaker 2: Thanks for having us. So the main reason for today's call..."}
              rows={10}
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#EE8953]/40 resize-y min-h-[200px]"
              style={inputStyle}
            />
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {text.length.toLocaleString()} characters · max 15,000
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}

          <button onClick={handleSummarise} disabled={loading || !text.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--teal-dark)", color: "var(--text-cream)" }}>
            {loading ? <><Spinner size="sm" light />Analysing transcript…</> : <><Sparkles className="w-4 h-4" />Generate Summary</>}
          </button>
          {loading && <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>Usually takes 15–25 seconds…</p>}

          {/* Quick link to create-doc */}
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <FileText className="w-5 h-5 shrink-0" style={{ color: "var(--orange)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Want a specific document instead?</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Use AI Create to generate reports, emails, agendas, and more.</p>
            </div>
            <Link href="/dashboard/create-doc" className="shrink-0 text-xs font-semibold hover:underline" style={{ color: "var(--orange)" }}>
              Open <ArrowRight className="inline w-3 h-3" />
            </Link>
          </div>
        </div>
      ) : (
        /* Results */
        <div className="space-y-5 anim-fade-up">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-light)" }}>
                  {result.type}
                </span>
                <SentimentBadge s={result.sentiment} />
                {result.date && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{result.date}</span>}
              </div>
              <h2 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.2rem,3vw,1.6rem)", fontWeight: 800, color: "var(--text-primary)" }}>
                {result.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm"
                style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy all"}
              </button>
              <button onClick={() => { setResult(null); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                New transcript
              </button>
            </div>
          </div>

          {/* Executive summary */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--orange)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white opacity-70 mb-2">Executive Summary</p>
            <p className="text-sm font-semibold text-white leading-relaxed">{result.executiveSummary}</p>
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Participants */}
            {result.participants.length > 0 && (
              <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" style={{ color: "var(--teal)" }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Participants</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.participants.map((p) => (
                    <span key={p} className="text-xs px-2 py-1 rounded-full"
                      style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sentiment + next steps */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: "var(--orange)" }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Next Steps</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{result.nextSteps}</p>
            </div>
          </div>

          {/* Key points */}
          {result.keyPoints.length > 0 && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Key Points</p>
              <ul className="space-y-2">
                {result.keyPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--teal)" }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Decisions */}
          {result.decisions.length > 0 && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#7CBFB5" + "30", border: "1px solid #7CBFB5" + "50" }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--teal)" }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--teal)" }}>Decisions Made</p>
              </div>
              <ul className="space-y-2">
                {result.decisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-primary)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--teal)" }} />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action items */}
          {result.actionItems.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
              <div className="px-5 py-3" style={{ backgroundColor: "var(--teal-dark)" }}>
                <p className="text-xs font-bold uppercase tracking-widest text-white">Action Items</p>
              </div>
              <div style={{ backgroundColor: "var(--bg-card-alt)" }}>
                {result.actionItems.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3 border-b last:border-0"
                    style={{ borderColor: "var(--border-light)" }}>
                    <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--orange)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>{a.task}</p>
                      <div className="flex gap-3 mt-0.5">
                        {a.owner && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Owner: {a.owner}</span>}
                        {a.dueDate && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Due: {a.dueDate}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Open questions */}
          {result.openQuestions.length > 0 && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#FEF9C3", border: "1px solid #F5E08A" }}>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4" style={{ color: "#854D0E" }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#854D0E" }}>Open Questions</p>
              </div>
              <ul className="space-y-2">
                {result.openQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "#4A3000" }}>
                    <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" style={{ color: "#854D0E" }} />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
