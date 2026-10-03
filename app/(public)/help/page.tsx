"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Sparkles, CalendarClock, Globe, FileText, MessageSquare, BookOpen, Lock } from "lucide-react";
import PreConvaraLogo from "@/components/PreConvaraLogo";
import AiChatWidget from "@/components/AiChatWidget";
import { getCurrentUser } from "@/lib/auth";

// ── Article definition ────────────────────────────────────────────────────────
// href:        where to go (always the real destination)
// guestHref:  where to go if NOT logged in (default: /signup)
// requiresAuth: shows a lock badge to unauthenticated visitors
// note:        small hint shown under the link

const CATEGORIES: {
  icon: React.ReactNode;
  color: string;
  title: string;
  articles: { q: string; href: string; guestHref?: string; requiresAuth?: boolean; note?: string }[];
}[] = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    color: "var(--orange)",
    title: "Getting started",
    articles: [
      { q: "How do I create my first brief?",           href: "/dashboard/create", guestHref: "/signup",   requiresAuth: true,  note: "Create a free account to start" },
      { q: "What is the difference between call types?", href: "/faq#call-types" },
      { q: "Do I need an account?",                      href: "/faq#account" },
    ],
  },
  {
    icon: <FileText className="w-5 h-5" />,
    color: "var(--teal)",
    title: "Briefs & drafts",
    articles: [
      { q: "What sections does a brief contain?",                href: "/faq#sections" },
      { q: "How do I save a brief as a draft?",                  href: "/faq#drafts" },
      { q: "What do [From Website] and [AI Observation] mean?",  href: "/faq#labels" },
    ],
  },
  {
    icon: <Globe className="w-5 h-5" />,
    color: "#059669",
    title: "Website analysis",
    articles: [
      { q: "How does the website analyzer work?",          href: "/faq#website" },
      { q: "Why did my website analysis fail?",            href: "/faq#website" },
      { q: "What information is extracted from websites?", href: "/faq#website" },
    ],
  },
  {
    icon: <CalendarClock className="w-5 h-5" />,
    color: "#1967D2",
    title: "Scheduling & integrations",
    articles: [
      { q: "How does Add to Calendar work?",       href: "/faq#calendar" },
      { q: "How do I send a brief to WhatsApp?",   href: "/faq#whatsapp" },
      { q: "Schedule an appointment",              href: "/dashboard/schedule", guestHref: "/signup", requiresAuth: true, note: "Requires an account" },
    ],
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    color: "#7C3AED",
    title: "Account & security",
    articles: [
      { q: "How do I reset my password?", href: "/forgot-password" },
      { q: "Is my data private?",         href: "/legal/privacy" },
      { q: "How do I delete my account?", href: "/contact" },
    ],
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    color: "#D97706",
    title: "Legal & compliance",
    articles: [
      { q: "Privacy Policy",            href: "/legal/privacy" },
      { q: "Terms of Service",          href: "/legal/terms" },
      { q: "Data Processing Agreement", href: "/legal/dpa" },
    ],
  },
];

// ── Article link ──────────────────────────────────────────────────────────────

function ArticleLink({
  q, href, guestHref, requiresAuth, note, loggedIn,
}: {
  q: string; href: string; guestHref?: string;
  requiresAuth?: boolean; note?: string; loggedIn: boolean;
}) {
  const destination = requiresAuth && !loggedIn ? (guestHref ?? "/signup") : href;
  return (
    <li>
      <Link
        href={destination}
        className="group text-sm flex items-start gap-1.5 hover:underline"
        style={{ color: "var(--teal)" }}
      >
        <span className="flex-1">{q}</span>
        {requiresAuth && !loggedIn && (
          <Lock className="w-3 h-3 shrink-0 mt-0.5 opacity-40" />
        )}
      </Link>
      {note && !loggedIn && requiresAuth && (
        <p className="text-[11px] mt-0.5 ml-0" style={{ color: "var(--text-muted)" }}>{note}</p>
      )}
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [search, setSearch]   = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getCurrentUser());
  }, []);

  const filtered = search.trim()
    ? CATEGORIES.map((cat) => ({
        ...cat,
        articles: cat.articles.filter((a) =>
          a.q.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((cat) => cat.articles.length > 0)
    : CATEGORIES;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-canvas)" }}>
      {/* Nav */}
      <nav className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/"><PreConvaraLogo size={28} /></Link>
          <div className="flex items-center gap-4">
            {loggedIn ? (
              <Link href="/dashboard" className="text-sm font-semibold hover:opacity-70 transition-opacity"
                style={{ color: "var(--orange)" }}>
                Go to dashboard →
              </Link>
            ) : (
              <Link href="/signup" className="text-sm font-semibold hover:opacity-70 transition-opacity"
                style={{ color: "var(--orange)" }}>
                Sign up free →
              </Link>
            )}
            <Link href="/" className="text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-secondary)" }}>← Home</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="py-16 text-center px-4"
        style={{ background: "linear-gradient(to bottom, var(--teal-dark) 0%, var(--bg-canvas) 100%)" }}>
        <p className="label-eyebrow mb-3" style={{ color: "var(--orange)" }}>Help Centre</p>
        <h1 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.8rem,5vw,3rem)", fontWeight: 800, color: "var(--text-cream)" }}>
          How can we help?
        </h1>
        <div className="mt-6 max-w-lg mx-auto">
          <input type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help articles…"
            className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#EE8953]/40"
            style={{ backgroundColor: "#fff", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
        </div>
        <p className="mt-4 text-sm opacity-60" style={{ color: "var(--text-cream)" }}>
          Or use the AI chat (bottom-right) for instant answers.
        </p>
      </div>

      {/* Categories */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ icon, color, title, articles }) => (
            <div key={title} className="rounded-2xl p-5"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: color + "18" }}>
                  <span style={{ color }}>{icon}</span>
                </div>
                <p className="font-bold text-sm" style={{ fontFamily: "var(--font-bricolage),sans-serif", color: "var(--text-primary)" }}>
                  {title}
                </p>
              </div>
              <ul className="space-y-2.5">
                {articles.map((a) => (
                  <ArticleLink key={a.q} {...a} loggedIn={loggedIn} />
                ))}
              </ul>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No results for "{search}".</p>
            <Link href="/contact" className="mt-3 inline-block text-sm font-semibold hover:underline"
              style={{ color: "var(--orange)" }}>Contact support →</Link>
          </div>
        )}

        {/* Still need help */}
        <div className="mt-10 rounded-2xl p-6 text-center" style={{ backgroundColor: "var(--teal-dark)" }}>
          <p className="text-sm font-bold mb-1 text-white"
            style={{ fontFamily: "var(--font-bricolage),sans-serif" }}>Still need help?</p>
          <p className="text-xs mb-5 opacity-60 text-white">Can't find what you're looking for?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/contact" className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--orange)", color: "#fff" }}>Contact support</Link>
            <Link href="/faq" className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>
              Browse full FAQ
            </Link>
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
            <Link href="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </footer>

      <AiChatWidget />
    </div>
  );
}
