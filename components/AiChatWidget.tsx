"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Sparkles, RefreshCw } from "lucide-react";
import Spinner from "@/components/Spinner";
import MarkdownRenderer from "@/components/MarkdownRenderer";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

// ── Suggested starter questions ───────────────────────────────────────────────

const STARTERS = [
  "How do I generate my first brief?",
  "What does website analysis do?",
  "How do I use AI Create?",
  "How do I connect Slack?",
  "How do I connect Gmail?",
  "How do I send a brief to WhatsApp?",
  "What is Ask AI?",
  "What is the Transcripts feature?",
];

// ── Sub-components ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: "var(--orange)" }}
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      {/* Bubble */}
      <div
        className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
        style={
          isUser
            ? { backgroundColor: "var(--teal-dark)", color: "var(--text-cream)", borderBottomRightRadius: "4px" }
            : { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-light)", borderBottomLeftRadius: "4px" }
        }
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <MarkdownRenderer
            content={msg.content}
            style={{ fontSize: "0.875rem", lineHeight: "1.65" }}
          />
        )}
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export default function AiChatWidget() {
  const [open, setOpen]           = useState(false);
  const [input, setInput]         = useState("");
  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [unread, setUnread]       = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLTextAreaElement>(null);

  // Greet on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: "greeting",
        role: "assistant",
        content: "Hi! I'm the PreConvara AI assistant. I can help you understand how the app works, explain your brief, or give tips for your next client call. What do you need?",
        ts: Date.now(),
      }]);
    }
    if (open) {
      setUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (!open) setUnread(true);
    } catch {
      setError("Could not reach the assistant. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [messages, loading, open]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
  }

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-20 right-5 z-50 w-[340px] sm:w-[380px] flex flex-col rounded-2xl overflow-hidden shadow-2xl anim-scale-in"
          style={{
            backgroundColor: "var(--bg-card-alt)",
            border: "1px solid var(--border)",
            maxHeight: "520px",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ backgroundColor: "var(--teal-dark)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--orange)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: "var(--text-cream)", fontFamily: "var(--font-bricolage), sans-serif" }}>
                PreConvara AI
              </p>
              <p className="text-[10px] opacity-50" style={{ color: "var(--text-cream)" }}>
                Responds immediately
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear chat"
                className="p-1.5 rounded-lg opacity-40 hover:opacity-80 transition-opacity"
                style={{ color: "var(--text-cream)" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg opacity-40 hover:opacity-80 transition-opacity"
                style={{ color: "var(--text-cream)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--orange)" }}>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl flex items-center gap-2"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <Spinner size="sm" />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Thinking…</span>
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs px-3 py-2 rounded-xl"
                style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Starters — show when only greeting is visible */}
          {messages.length === 1 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full border transition-all hover:shadow-sm"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 shrink-0 border-t" style={{ borderColor: "var(--border-light)" }}>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type here…"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[#E8652A]/30 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  maxHeight: "96px",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: "var(--orange)", color: "#fff" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-center" style={{ color: "var(--text-muted)" }}>
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* ── Floating button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 hover:shadow-2xl"
        style={{ backgroundColor: open ? "var(--teal-dark)" : "var(--orange)", color: "#fff" }}
        aria-label="Open AI assistant"
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}

        {/* Unread dot */}
        {unread && !open && (
          <span
            className="absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white"
            style={{ backgroundColor: "#22C55E" }}
          />
        )}
      </button>
    </>
  );
}
