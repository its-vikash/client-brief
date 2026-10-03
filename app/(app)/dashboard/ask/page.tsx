"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, Send, Copy, Check, Sparkles,
  AlertCircle, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import Spinner from "@/components/Spinner";
import MarkdownRenderer from "@/components/MarkdownRenderer";

// ── Quick-prompt shortcuts ────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  {
    category: "📋 Priorities",
    prompts: [
      { label: "This week's priorities", prompt: "Give me a structured list of top priorities for a freelance web developer this week. Format as a prioritised task list with Critical, Important, and Nice-to-Have sections." },
      { label: "Clear my backlog", prompt: "Help me structure a backlog of tasks into a prioritised to-do list. I'll paste my notes below — organise them by urgency and impact." },
      { label: "Weekly review template", prompt: "Create a Weekly Review template for a freelance developer: wins, blockers, priorities for next week, and client health checks." },
    ],
  },
  {
    category: "📅 Planning",
    prompts: [
      { label: "Product roadmap", prompt: "Create a 3-month product roadmap template with phases, milestones, owners, and success metrics. Format as a structured document." },
      { label: "Project kickoff plan", prompt: "Write a Project Kickoff Plan template including: objectives, scope, team, timeline, risks, and definition of done." },
      { label: "Sprint planning doc", prompt: "Create a Sprint Planning document for a 2-week sprint. Include: sprint goal, selected stories, capacity, dependencies, and DoD." },
    ],
  },
  {
    category: "✉️ Client Emails",
    prompts: [
      { label: "Follow-up after call", prompt: "Write a professional follow-up email after a discovery call with a new client. Include: thanks for their time, summary of what we discussed, agreed next steps, and a clear call to action." },
      { label: "Project proposal", prompt: "Write a professional project proposal email introducing our services, outlining the proposed approach, timeline, and investment. Tone: confident but approachable." },
      { label: "Delay notification", prompt: "Write a professional email to notify a client of a project delay. Be honest, take responsibility, explain the reason briefly, and give a revised timeline. Tone: apologetic but solution-focused." },
      { label: "Invoice reminder", prompt: "Write a polite but firm payment reminder email for an overdue invoice. Include: invoice reference placeholder, amount placeholder, due date, and payment methods." },
    ],
  },
  {
    category: "🚀 Business",
    prompts: [
      { label: "Service pricing guide", prompt: "Create a pricing guide framework for a freelance web developer. Include: discovery, design, development, retainer tiers, and how to communicate value over price." },
      { label: "Client onboarding checklist", prompt: "Write a comprehensive client onboarding checklist for a web development project. Cover: contract, access, assets, communication, and project kick-off." },
      { label: "Case study template", prompt: "Create a compelling case study template for a web development project. Include: client background, challenge, solution, process, results, and testimonial placeholder." },
    ],
  },
];

// ── Message type ──────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const inputStyle = { backgroundColor: "var(--bg-card-alt)", border: "1px solid var(--border)", color: "var(--text-primary)" };

export default function AskPage() {
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [input,        setInput]         = useState("");
  const [context,      setContext]       = useState("");
  const [showContext,  setShowContext]   = useState(false);
  const [loading,      setLoading]       = useState(false);
  const [error,        setError]         = useState<string | null>(null);
  const [copiedId,     setCopiedId]      = useState<string | null>(null);
  const [openCat,      setOpenCat]       = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(promptText: string) {
    const text = promptText.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput(""); setError(null); setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, context: context || undefined }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? "Request failed."); return; }
      const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: data.answer, ts: Date.now() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function copyMessage(id: string, content: string) {
    await navigator.clipboard.writeText(content);
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto px-4 sm:px-10 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-7 opacity-50 hover:opacity-100 transition-opacity anim-fade-in"
        style={{ color: "var(--text-secondary)" }}>
        <ChevronLeft className="w-4 h-4" /> Back to overview
      </Link>

      <div className="mb-6 anim-fade-up">
        <p className="label-eyebrow mb-3">AI Ask</p>
        <h1 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800, lineHeight: 1.1, color: "var(--text-primary)" }}>
          Ask anything.<br /><span style={{ color: "var(--orange)" }}>Get it done.</span>
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Priorities, roadmaps, client emails, proposals — just ask.
        </p>
      </div>

      {/* Quick prompts */}
      <div className="mb-6 space-y-2 anim-fade-up-1">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Quick prompts</p>
        {QUICK_PROMPTS.map(({ category, prompts }) => (
          <div key={category} className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <button
              onClick={() => setOpenCat(openCat === category ? null : category)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
            >
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{category}</span>
              {openCat === category
                ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              }
            </button>
            {openCat === category && (
              <div className="px-4 pb-3 flex flex-wrap gap-2 border-t" style={{ borderColor: "var(--border-light)" }}>
                <div className="h-2" />
                {prompts.map(({ label, prompt }) => (
                  <button key={label} onClick={() => sendMessage(prompt)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all hover:shadow-sm disabled:opacity-40"
                    style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Optional context */}
      <div className="mb-4 rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <button onClick={() => setShowContext((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/[0.02] transition-colors">
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Optional: add context (client name, project details, notes)
          </span>
          {showContext
            ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          }
        </button>
        {showContext && (
          <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border-light)" }}>
            <textarea value={context} onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Client: Northstar Studio. Project: Website redesign. Budget: £8k. Timeline: 3 months. They want a portfolio-led design."
              rows={3} className="mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none resize-y focus:ring-2 focus:ring-[#EE8953]/40"
              style={inputStyle} />
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              This context is sent with every message so answers are more specific to your situation.
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 space-y-4 mb-4 max-h-[500px] overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2.5`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "var(--orange)" }}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="max-w-[85%]">
                <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={msg.role === "user"
                    ? { backgroundColor: "var(--teal-dark)", color: "var(--text-cream)", borderBottomRightRadius: "4px" }
                    : { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-light)", borderBottomLeftRadius: "4px" }
                  }>
                  {msg.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap" style={{ fontFamily: "var(--font-dm-sans),sans-serif" }}>{msg.content}</p>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>
                {msg.role === "assistant" && (
                  <button onClick={() => copyMessage(msg.id, msg.content)}
                    className="mt-1.5 flex items-center gap-1 text-xs opacity-40 hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-muted)" }}>
                    {copiedId === msg.id ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--orange)" }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <Spinner size="sm" /><span className="text-sm" style={{ color: "var(--text-muted)" }}>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm mb-3"
          style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-2 items-end">
        <textarea value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="Ask anything… e.g. 'Write a follow-up email for my meeting with Northstar Studio'"
          rows={2} disabled={loading}
          className="flex-1 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-[#EE8953]/40 disabled:opacity-50"
          style={{ ...inputStyle, maxHeight: "120px" }} />
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
            {loading ? <Spinner size="sm" light /> : <Send className="w-4 h-4" />}
          </button>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} title="Clear conversation"
              className="w-10 h-10 rounded-xl flex items-center justify-center opacity-30 hover:opacity-70 transition-opacity"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-center" style={{ color: "var(--text-muted)" }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
