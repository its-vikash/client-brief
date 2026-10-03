"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, FileText, Wand2, Copy, Check, Download,
  AlertCircle, Sparkles,
} from "lucide-react";
import Spinner from "@/components/Spinner";
import MarkdownRenderer, { markdownToHtml } from "@/components/MarkdownRenderer";

// ── Document themes ───────────────────────────────────────────────────────────
const THEMES: { key: "professional" | "minimal" | "dark"; label: string; desc: string; preview: string }[] = [
  {
    key: "professional",
    label: "Professional",
    desc: "Classic serif with warm tones",
    preview: "bg-white text-gray-900 border-gray-200",
  },
  {
    key: "minimal",
    label: "Minimal",
    desc: "Clean system font, light grey",
    preview: "bg-gray-50 text-gray-800 border-gray-100",
  },
  {
    key: "dark",
    label: "Dark",
    desc: "Dark teal background",
    preview: "bg-[#1c2b2d] text-[#f5f1ea] border-[#2e4548]",
  },
];

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { key: "meeting_summary",    label: "Meeting Summary",         icon: "📋", desc: "Summary with decisions and action items" },
  { key: "follow_up_email",    label: "Follow-up Email",         icon: "✉️",  desc: "Ready-to-send email recap" },
  { key: "next_agenda",        label: "Next Meeting Agenda",     icon: "📅", desc: "Agenda for the next session" },
  { key: "project_document",   label: "Project Document",        icon: "📁", desc: "Scope, milestones, risks" },
  { key: "customer_feedback",  label: "Customer Feedback Report",icon: "💬", desc: "Themes, pain points, recommendations" },
  { key: "interview_scorecard",label: "Interview Scorecard",     icon: "🎯", desc: "Competency ratings and recommendation" },
  { key: "priorities_list",    label: "Priorities List",         icon: "🔴", desc: "Critical, important, nice-to-have" },
  { key: "custom",             label: "Custom Prompt",            icon: "✨", desc: "Write your own instructions" },
];

const inputClass = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#EE8953]/40 resize-y";
const inputStyle = { backgroundColor: "var(--bg-card-alt)", border: "1px solid var(--border)", color: "var(--text-primary)" };

export default function CreateDocPage() {
  const [transcript,   setTranscript]   = useState("");
  const [templateKey,  setTemplateKey]  = useState("meeting_summary");
  const [customPrompt, setCustomPrompt] = useState("");
  const [theme,        setTheme]        = useState<"professional" | "minimal" | "dark">("professional");
  const [generating,   setGenerating]   = useState(false);
  const [docContent,   setDocContent]   = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [copied,       setCopied]       = useState(false);

  const selectedTemplate = TEMPLATES.find((t) => t.key === templateKey)!;
  const selectedTheme    = THEMES.find((t) => t.key === theme)!;

  async function handleGenerate() {
    if (!transcript.trim()) { setError("Please paste your transcript first."); return; }
    setGenerating(true); setError(null); setDocContent(null);
    try {
      const res = await fetch("/api/create-doc", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, templateKey, customPrompt }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? "Generation failed."); return; }
      setDocContent(data.document);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setGenerating(false); }
  }

  async function handleCopy() {
    if (!docContent) return;
    await navigator.clipboard.writeText(docContent);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  }

  function handleDownload() {
    if (!docContent) return;
    // Download as styled HTML — renders exactly like the preview
    const html = markdownToHtml(docContent, theme);
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = window.document.createElement("a");
    a.href = url; a.download = `${selectedTemplate.label}.html`;
    a.click(); URL.revokeObjectURL(url);
  }

  // Preview background based on theme
  const previewBg = theme === "dark" ? "var(--teal-dark)" : theme === "minimal" ? "#fafafa" : "#ffffff";
  const previewColor = theme === "dark" ? "var(--text-cream)" : "var(--text-primary)";

  return (
    <div className="min-h-full px-4 sm:px-10 py-8 max-w-5xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-7 opacity-50 hover:opacity-100 transition-opacity anim-fade-in"
        style={{ color: "var(--text-secondary)" }}>
        <ChevronLeft className="w-4 h-4" /> Back to overview
      </Link>

      <div className="mb-8 anim-fade-up">
        <p className="label-eyebrow mb-3">AI Create</p>
        <h1 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, lineHeight: 1.1, color: "var(--text-primary)" }}>
          Turn transcripts into<br /><span style={{ color: "var(--orange)" }}>any document.</span>
        </h1>
        <p className="mt-3 text-sm max-w-lg" style={{ color: "var(--text-secondary)" }}>
          Paste a meeting transcript, interview, or conversation. Choose a template and design. Download a beautifully formatted HTML document.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start anim-fade-up-1">

        {/* Left — inputs */}
        <div className="space-y-5">

          {/* Template picker */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Template</p>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.key} type="button"
                  onClick={() => { setTemplateKey(t.key); setError(null); }}
                  className="text-left rounded-xl p-3 transition-all hover:shadow-sm"
                  style={{
                    backgroundColor: templateKey === t.key ? "var(--bg-card-alt)" : "var(--bg-card)",
                    border: templateKey === t.key ? "1.5px solid var(--orange)" : "1.5px solid var(--border-light)",
                  }}>
                  <span className="text-base mr-1.5">{t.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{t.label}</span>
                  <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "var(--text-muted)" }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Document theme */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Document design</p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((th) => (
                <button key={th.key} type="button"
                  onClick={() => setTheme(th.key)}
                  className="text-left rounded-xl p-3 transition-all hover:shadow-sm"
                  style={{
                    backgroundColor: theme === th.key ? "var(--bg-card-alt)" : "var(--bg-card)",
                    border: theme === th.key ? "1.5px solid var(--teal)" : "1.5px solid var(--border-light)",
                  }}>
                  {/* Mini colour swatch */}
                  <div className="flex gap-1 mb-2">
                    {th.key === "professional" && <><div className="w-3 h-3 rounded-full bg-white border" /><div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ee8953" }} /></>}
                    {th.key === "minimal"       && <><div className="w-3 h-3 rounded-full bg-gray-50 border" /><div className="w-3 h-3 rounded-full bg-gray-800" /></>}
                    {th.key === "dark"          && <><div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#1c2b2d" }} /><div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ee8953" }} /></>}
                  </div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{th.label}</p>
                  <p className="text-[10px] leading-tight mt-0.5" style={{ color: "var(--text-muted)" }}>{th.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom prompt */}
          {templateKey === "custom" && (
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                Your instructions <span style={{ color: "var(--orange)" }}>*</span>
              </label>
              <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Transform this into a product roadmap with quarterly milestones and owner assignments."
                rows={3} className={inputClass + " min-h-[80px]"} style={inputStyle} />
            </div>
          )}

          {/* Transcript */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
              Transcript or notes <span style={{ color: "var(--orange)" }}>*</span>
            </label>
            <textarea value={transcript}
              onChange={(e) => { setTranscript(e.target.value); setError(null); }}
              placeholder={"[Speaker 1]: We need to launch the new feature by end of Q4...\n[Speaker 2]: I think we should prioritise the API first..."}
              rows={12} disabled={generating}
              className={inputClass + " min-h-[200px]"} style={inputStyle} />
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {transcript.length.toLocaleString()} chars · max 15,000
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={generating || !transcript.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--teal-dark)", color: "var(--text-cream)" }}>
            {generating
              ? <><Spinner size="sm" light />Generating {selectedTemplate.label}…</>
              : <><Wand2 className="w-4 h-4" />Generate {selectedTemplate.icon} {selectedTemplate.label}</>
            }
          </button>
          {generating && <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>Usually 15–25 seconds…</p>}
        </div>

        {/* Right — rendered output */}
        <div>
          {docContent ? (
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ border: "1px solid var(--border-light)" }}>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 shrink-0"
                style={{ backgroundColor: "var(--teal-dark)" }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white opacity-70" />
                  <span className="text-sm font-semibold text-white">
                    {selectedTemplate.icon} {selectedTemplate.label}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full opacity-60 text-white"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                    {selectedTheme.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy text"}
                  </button>
                  <button onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }}>
                    <Download className="w-3.5 h-3.5" />
                    Download HTML
                  </button>
                </div>
              </div>

              {/* Rendered document preview */}
              <div className="overflow-y-auto max-h-[640px] p-6 sm:p-8"
                style={{ backgroundColor: previewBg }}>
                {/* Dark theme: inject CSS variable overrides so MarkdownRenderer's classes use light colours */}
                {theme === "dark" && (
                  <style>{`
                    .md-dark-scope .md-h1, .md-dark-scope .md-h2, .md-dark-scope .md-h3,
                    .md-dark-scope .md-h4, .md-dark-scope .md-h5, .md-dark-scope .md-h6 { color: #f5f1ea !important; }
                    .md-dark-scope .md-p { color: rgba(245,241,234,0.75) !important; }
                    .md-dark-scope .md-list li { color: rgba(245,241,234,0.75) !important; }
                    .md-dark-scope .md-h2 { border-bottom-color: rgba(255,255,255,0.12) !important; }
                    .md-dark-scope .md-hr { border-top-color: rgba(255,255,255,0.12) !important; }
                    .md-dark-scope .md-blockquote { color: rgba(245,241,234,0.6) !important; border-left-color: #ee8953 !important; background: rgba(255,255,255,0.05) !important; }
                    .md-dark-scope .md-checkbox { color: rgba(245,241,234,0.75) !important; }
                    .md-dark-scope .md-check { border-color: rgba(255,255,255,0.25) !important; }
                    .md-dark-scope .md-table th { background: rgba(255,255,255,0.1) !important; color: #f5f1ea !important; }
                    .md-dark-scope .md-table td { color: rgba(245,241,234,0.75) !important; border-bottom-color: rgba(255,255,255,0.08) !important; }
                    .md-dark-scope .md-table tr:nth-child(even) td { background: rgba(255,255,255,0.04) !important; }
                  `}</style>
                )}
                <MarkdownRenderer
                  content={docContent}
                  className={theme === "dark" ? "md-dark-scope" : undefined}
                  style={{
                    fontFamily: theme === "professional" ? "Georgia, serif" : "var(--font-dm-sans),sans-serif",
                    color: previewColor,
                  }}
                />
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2.5 border-t text-xs text-center"
                style={{ borderColor: "var(--border-light)", color: "var(--text-muted)", backgroundColor: "var(--bg-card)" }}>
                Download as HTML to get the same styled layout · Print or share from your browser
              </div>
            </div>
          ) : (
            <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
              style={{ backgroundColor: "var(--bg-card)", border: "2px dashed var(--border)" }}>
              <FileText className="w-12 h-12 mb-4 opacity-20" style={{ color: "var(--text-secondary)" }} />
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Your document will appear here
              </p>
              <p className="text-xs max-w-xs" style={{ color: "var(--text-muted)" }}>
                Paste your transcript, choose a template and design, then click Generate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
