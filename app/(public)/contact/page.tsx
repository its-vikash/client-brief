"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import PreConvaraLogo from "@/components/PreConvaraLogo";
import Spinner from "@/components/Spinner";

const TOPICS = [
  "General question",
  "Bug report",
  "Feature request",
  "Billing",
  "Privacy / data request",
  "Partnership",
  "Other",
];

const inputClass = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#EE8953]/40";
const inputStyle = {
  backgroundColor: "#fff",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
};

export default function ContactPage() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [topic, setTopic]     = useState("General question");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all required fields."); return;
    }
    setLoading(true); setError(null);
    // Simulate send (replace with real email API — Resend, SendGrid, etc.)
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-canvas)" }}>
      {/* Nav */}
      <nav className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/"><PreConvaraLogo size={28} /></Link>
          <Link href="/" className="text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-secondary)" }}>← Back to home</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

          {/* Left — info */}
          <div className="lg:col-span-2">
            <p className="label-eyebrow mb-3">Get in touch</p>
            <h1 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800, lineHeight: 1.1, color: "var(--text-primary)" }}>
              We'd love to<br /><span style={{ color: "var(--orange)" }}>hear from you.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Have a question, feedback, or a feature idea? Drop us a message and we'll get back to you within one business day.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: <Mail className="w-4 h-4" />, label: "General", value: "hello@preconvara.com" },
                { icon: <Mail className="w-4 h-4" />, label: "Privacy", value: "privacy@preconvara.com" },
                { icon: <Mail className="w-4 h-4" />, label: "Security", value: "security@preconvara.com" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl p-4"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4" style={{ color: "var(--orange)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Faster? Use AI chat</p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                The AI assistant in the bottom-right corner can answer most questions about PreConvara instantly.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="rounded-2xl p-10 text-center"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: "#E8F5E4" }}>
                  <CheckCircle2 className="w-7 h-7" style={{ color: "#2D7A3A" }} />
                </div>
                <h2 className="text-xl font-extrabold mb-2"
                  style={{ fontFamily: "var(--font-bricolage),sans-serif", color: "var(--text-primary)" }}>
                  Message sent!
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  Thanks for reaching out. We'll get back to you within one business day.
                </p>
                <button onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); }}
                  className="text-sm font-semibold hover:underline" style={{ color: "var(--orange)" }}>
                  Send another message
                </button>
              </div>
            ) : (
              <div className="rounded-2xl p-6 sm:p-8"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        Name *
                      </label>
                      <input type="text" value={name}
                        onChange={(e) => { setName(e.target.value); setError(null); }}
                        placeholder="Your name" autoFocus
                        className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        Email *
                      </label>
                      <input type="email" value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        placeholder="you@example.com"
                        className={inputClass} style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Topic
                    </label>
                    <select value={topic} onChange={(e) => setTopic(e.target.value)}
                      className={inputClass} style={inputStyle}>
                      {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Message *
                    </label>
                    <textarea value={message}
                      onChange={(e) => { setMessage(e.target.value); setError(null); }}
                      placeholder="Tell us what's on your mind…"
                      rows={5}
                      className={`${inputClass} resize-y min-h-[120px]`} style={inputStyle} />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
                      style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
                    {loading ? <><Spinner size="sm" light />Sending…</> : "Send message →"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 mt-4" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <PreConvaraLogo size={24} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>© {new Date().getFullYear()} PreConvara.</p>
          <div className="flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
            <Link href="/legal/terms" className="hover:underline">Terms</Link>
            <Link href="/help" className="hover:underline">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
