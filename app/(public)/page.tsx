"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight, Sparkles, MessageSquare, HelpCircle,
  AlertTriangle, CheckCircle2, Globe, Mail, Calendar, Phone,
  BarChart3, Users, Zap, Star, ChevronDown, LogOut,
  LayoutDashboard, Menu, X, Clock, ShieldCheck,
} from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import AiChatWidget from "@/components/AiChatWidget";
import PreConvaraLogo from "@/components/PreConvaraLogo";

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".scroll-reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("revealed"); io.unobserve(e.target); }
      }),
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useParallax(factor = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = () => { if (ref.current) ref.current.style.transform = `translateY(${window.scrollY * factor}px)`; };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [factor]);
  return ref;
}

function useTypewriter(words: string[], speed = 80, pause = 1800) {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    const delay = deleting ? speed / 2 : charIdx === word.length ? pause : speed;
    const t = setTimeout(() => {
      if (!deleting && charIdx < word.length) {
        setDisplay(word.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      } else if (!deleting && charIdx === word.length) {
        setDeleting(true);
      } else if (deleting && charIdx > 0) {
        setDisplay(word.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      } else {
        setDeleting(false);
        setWordIdx((i) => (i + 1) % words.length);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return display;
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let n = 0; const step = to / 40;
        const t = setInterval(() => { n = Math.min(n + step, to); setVal(Math.round(n)); if (n >= to) clearInterval(t); }, 35);
        io.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Mobile Nav Drawer ────────────────────────────────────────────────────────

function MobileNavDrawer({ user, onClose }: { user: AuthUser | null; onClose: () => void }) {
  const router_module = require("next/navigation");
  const router = router_module.useRouter();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", fn); };
  }, [onClose]);

  function handleLogout() {
    logout();
    onClose();
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "#features",     label: "Features" },
    { href: "#how",          label: "How it works" },
    { href: "#faq",          label: "FAQ" },
    { href: "#integrations", label: "Integrations" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end anim-fade-in"
      style={{ backgroundColor: "rgba(28,43,45,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="h-full w-72 max-w-[88vw] flex flex-col anim-slide-in-right"
        style={{ backgroundColor: "var(--bg-sidebar)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <PreConvaraLogo size={30} light />
          <button onClick={onClose} className="p-2 rounded-xl opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-cream)" }} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 space-y-1 py-2">
          {links.map(({ href, label }) => (
            <button
              key={href}
              onClick={() => { scrollTo(href.slice(1)); onClose(); }}
              className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/8 bg-transparent border-0 cursor-pointer"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {label}
            </button>
          ))}
          <div className="h-px mx-1 my-3" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
          {user ? (
            <>
              <Link href="/dashboard" onClick={onClose}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/8"
                style={{ color: "rgba(255,255,255,0.7)" }}>
                <LayoutDashboard className="w-4 h-4 shrink-0" /> Dashboard
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/8"
                style={{ color: "#FCA5A5" }}>
                <LogOut className="w-4 h-4 shrink-0" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={onClose}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/8"
                style={{ color: "rgba(255,255,255,0.7)" }}>
                Sign in
              </Link>
              <Link href="/signup" onClick={onClose}
                className="flex items-center justify-center gap-2 mx-1 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
                Get started free
              </Link>
            </>
          )}
        </nav>

        {/* User info */}
        {user && (
          <div className="border-t px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: "var(--teal)", color: "var(--text-cream)" }}>
                {user.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--text-cream)" }}>{user.name}</p>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Landing FAQ ──────────────────────────────────────────────────────────────

const LANDING_FAQS = [
  { q: "What is PreConvara?", a: "PreConvara is an AI-powered meeting preparation tool for freelancers and agencies. It turns a client name, website URL, and your notes into a structured 12-section brief — talking points, questions, watchouts — in under 30 seconds." },
  { q: "How does website analysis work?", a: "When you provide a URL, our server fetches the page and extracts business information — services, messaging, calls-to-action, and potential opportunities. This research is woven into your brief automatically." },
  { q: "Is there a free plan?", a: "Yes — sign up and create briefs completely free. No credit card required, no setup, no time limit." },
  { q: "Is my data private?", a: "Completely. Every brief belongs to your account only. All AI processing happens server-side and your keys are never exposed to the browser." },
  { q: "What integrations do you support?", a: "Currently: Google Calendar (one-click follow-up events) and WhatsApp (brief summaries to your phone). Coming soon: Gmail, HubSpot, Salesforce, Stripe, and team accounts." },
  { q: "Can I save a draft without generating?", a: "Yes — 'Save as draft' preserves your context so you can complete the brief later. Drafts appear in your dashboard with a yellow badge." },
];

function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-20 scroll-reveal">
      <div className="text-center mb-12">
        <p className="label-eyebrow mb-3">Got questions?</p>
        <h2 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, color: "var(--text-primary)" }}>
          Frequently asked questions
        </h2>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        {LANDING_FAQS.map(({ q, a }, i) => (
          <div key={i} className="border-b last:border-0" style={{ borderColor: "var(--border-light)" }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.02]">
              <span className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{q}</span>
              <ChevronDown className="w-4 h-4 shrink-0 mt-0.5 transition-transform"
                style={{ color: "var(--text-muted)", transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
            {open === i && (
              <div className="px-5 pb-5 pr-14">
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Smooth-scroll helper ─────────────────────────────────────────────────────
// Native anchor href="#id" uses instant scroll on some browsers when
// scroll-behavior is controlled via the data attribute. This helper forces
// smooth scrollIntoView so header links always animate correctly.

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <button
      onClick={() => scrollTo(href.slice(1))}
      className="text-sm font-medium hover:opacity-70 transition-opacity capitalize bg-transparent border-0 cursor-pointer"
      style={{ color: "var(--text-secondary)" }}
    >
      {label}
    </button>
  );
}

// ─── Feature card with hover glow ─────────────────────────────────────────────

function FeatureCard({ icon, color, title, desc, large = false }: {
  icon: React.ReactNode; color: string; title: string; desc: string; large?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative h-full rounded-2xl p-5 sm:p-6 flex flex-col gap-3 overflow-hidden transition-all duration-300 cursor-default group"
      style={{
        backgroundColor: "var(--bg-card)",
        border: `1px solid ${hovered ? color + "60" : "var(--border-light)"}`,
        boxShadow: hovered ? `0 8px 40px ${color}18` : "none",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      {/* Hover glow background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 70% 60% at 10% 10%, ${color}10, transparent 70%)` }} />

      <div className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="relative">
        <p className="font-bold text-sm mb-1.5" style={{ fontFamily: "var(--font-bricolage),sans-serif", color: "var(--text-primary)" }}>
          {title}
        </p>
        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── FAQ Accordion (dark theme — used inside the combined section) ─────────────

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {LANDING_FAQS.map(({ q, a }, i) => (
        <div key={i} className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-start justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/5"
          >
            <span className="text-sm font-semibold leading-snug text-white">{q}</span>
            <ChevronDown
              className="w-4 h-4 shrink-0 mt-0.5 transition-transform"
              style={{ color: "rgba(255,255,255,0.5)", transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>
          {open === i && (
            <div className="px-4 pb-4">
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const parallaxRef = useParallax(0.12);
  useScrollReveal();

  const typeword = useTypewriter([
    "every client call.",
    "every discovery session.",
    "every pitch meeting.",
    "every kickoff call.",
  ], 70, 2000);

  useEffect(() => {
    setUser(getCurrentUser());
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg-canvas)" }}>

      {/* ── Sticky Nav ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? "rgba(234,229,220,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "none",
        }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <PreConvaraLogo size={32} />
          </Link>

          {/* Desktop centre links */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { href: "#features",     label: "Features" },
              { href: "#how",          label: "How it works" },
              { href: "#faq",          label: "FAQ" },
              { href: "#integrations", label: "Integrations" },
            ].map(({ href, label }) => (
              <NavLink key={href} href={href} label={label} />
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: "var(--teal-dark)", color: "var(--text-cream)" }}>
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium opacity-50 hover:opacity-80 transition-opacity"
                  style={{ color: "var(--text-secondary)" }}>
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-secondary)" }}>Sign in</Link>
                <Link href="/signup"
                  className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
                  Get started →
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-xl transition-opacity hover:opacity-70"
            style={{ color: "var(--text-primary)" }}
            onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileOpen && <MobileNavDrawer user={user} onClose={() => setMobileOpen(false)} />}

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-20 pb-12 overflow-hidden">
        {/* Parallax blobs */}
        <div ref={parallaxRef} className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-[15%] left-[6%] w-56 sm:w-80 h-56 sm:h-80 rounded-full opacity-20 anim-float-slow"
            style={{ backgroundColor: "var(--orange)", filter: "blur(80px)" }} />
          <div className="absolute bottom-[20%] right-[8%] w-64 sm:w-96 h-64 sm:h-96 rounded-full opacity-15 anim-float"
            style={{ backgroundColor: "var(--teal)", filter: "blur(100px)", animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full opacity-10"
            style={{ backgroundColor: "#7CBFB5", filter: "blur(120px)" }} />
        </div>

        <div className="relative flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="relative inline-flex items-center gap-2 mb-8">
            <div className="absolute inset-0 rounded-full anim-pulse-ring" style={{ backgroundColor: "var(--orange)" }} />
            <div className="relative inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest"
              style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
              <Sparkles className="w-3.5 h-3.5" /> AI-powered meeting prep
            </div>
          </div>

          {/* Headline with typewriter */}
          <h1 className="anim-fade-up" style={{
            fontFamily: "var(--font-bricolage),sans-serif",
            fontSize: "clamp(2.4rem, 7vw, 5.2rem)",
            fontWeight: 800, lineHeight: 1.04,
            letterSpacing: "-0.03em", color: "var(--text-primary)",
          }}>
            Walk into<br />
            <span className="gradient-text">{typeword}</span>
            <span className="inline-block w-0.5 h-[0.9em] ml-1 align-middle animate-pulse rounded-sm"
              style={{ backgroundColor: "var(--orange)" }} />
          </h1>

          <p className="anim-fade-up-1 mt-5 text-base sm:text-lg max-w-2xl leading-relaxed px-4"
            style={{ color: "var(--text-secondary)" }}>
            Enter a company name, website URL, and your notes.{" "}
            <strong style={{ color: "var(--text-primary)" }}>PreConvara</strong>{" "}
            produces a sharp 12-section brief — talking points, discovery questions,
            watchouts, and a suggested opening — in{" "}
            <em>under 30 seconds.</em>
          </p>

          {/* CTAs */}
          <div className="anim-fade-up-2 mt-10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {user ? (
              <Link href="/dashboard"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.04] hover:shadow-2xl active:scale-[0.98]"
                style={{ backgroundColor: "var(--teal-dark)", color: "#fff" }}>
                Go to your dashboard
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link href="/signup"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.04] hover:shadow-2xl active:scale-[0.98]"
                  style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
                  Create your first brief — free
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-sm transition-all hover:opacity-70"
                  style={{ color: "var(--text-secondary)", border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
                  Sign in
                </Link>
              </>
            )}
          </div>

          {!user && (
            <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
              No credit card · No setup · 30 seconds to your first brief
            </p>
          )}

          <a href="#features" className="mt-14 flex flex-col items-center gap-1 opacity-40 hover:opacity-70 transition-opacity">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Scroll to explore</span>
            <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: "var(--text-muted)" }} />
          </a>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <section className="scroll-reveal py-10 border-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { n: 500, s: "+", label: "Briefs generated" },
            { n: 30,  s: "s", label: "Avg generation time" },
            { n: 12,  s: "",  label: "Sections per brief" },
            { n: 3,   s: "",  label: "AI model fallbacks" },
          ].map(({ n, s, label }) => (
            <div key={label}>
              <p className="text-3xl sm:text-4xl font-extrabold mb-1"
                style={{ fontFamily: "var(--font-bricolage),sans-serif", color: "var(--text-primary)" }}>
                <Counter to={n} suffix={s} />
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features bento grid ─────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="scroll-reveal text-center mb-12">
          <p className="label-eyebrow mb-3">What you get</p>
          <h2 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "var(--text-primary)" }}>
            Everything you need.<br />Nothing you don't.
          </h2>
          <p className="mt-3 text-sm max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
            PreConvara combines live website research with your notes to produce briefs
            that are specific to each client — not generic templates.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="scroll-reveal scroll-reveal-delay-1 h-full">
            <FeatureCard
              icon={<MessageSquare className="w-5 h-5" />} color="var(--orange)"
              title="Tailored talking points"
              desc="5–7 concrete starters pulled from the client's actual website and your notes — specific, not generic."
            />
          </div>
          <div className="scroll-reveal scroll-reveal-delay-2 h-full">
            <FeatureCard
              icon={<HelpCircle className="w-5 h-5" />} color="var(--teal)"
              title="Discovery questions"
              desc="Smart questions shaped by the service type, call type, and what's still unknown about the prospect."
            />
          </div>
          <div className="scroll-reveal scroll-reveal-delay-3 h-full">
            <FeatureCard
              icon={<AlertTriangle className="w-5 h-5" />} color="#D97706"
              title="Watchouts & objections"
              desc="Potential concerns flagged before the call so you're never caught off guard mid-conversation."
            />
          </div>
          <div className="scroll-reveal scroll-reveal-delay-1 h-full">
            <FeatureCard
              icon={<Globe className="w-5 h-5" />} color="#059669"
              title="Live website research"
              desc="Paste a URL and we fetch and analyse the page server-side — services, messaging, and opportunities extracted automatically."
            />
          </div>
          <div className="scroll-reveal scroll-reveal-delay-2 h-full">
            <FeatureCard
              icon={<Clock className="w-5 h-5" />} color="#7C3AED"
              title="Ready in 30 seconds"
              desc="From rough notes to a 12-section structured brief — before your coffee goes cold."
            />
          </div>
          <div className="scroll-reveal scroll-reveal-delay-3 h-full">
            <FeatureCard
              icon={<ShieldCheck className="w-5 h-5" />} color="#1967D2"
              title="Fully private"
              desc="Every brief belongs to your account only. Row Level Security means no one else can access your data."
            />
          </div>
        </div>

        {/* Large mockup card */}
        <div className="mt-8 scroll-reveal">
          <div className="relative rounded-3xl overflow-hidden" style={{ backgroundColor: "var(--teal-dark)" }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full"
                style={{ backgroundColor: "var(--orange)", opacity: 0.07, filter: "blur(60px)", transform: "translate(30%,-30%)" }} />
            </div>
            <div className="relative p-6 sm:p-10 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
              {/* Left — brief preview */}
              <div>
                <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: "var(--orange)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">The Short Version</p>
                  <p className="text-sm font-bold text-white leading-snug">
                    Northstar Studio is preparing for a website redesign kickoff. They're on Squarespace and want a stronger portfolio presence.
                  </p>
                </div>
                {[
                  { l: "Talking points", c: "#F5F1EA", n: 6 },
                  { l: "Questions to ask", c: "#7CBFB5", n: 5 },
                  { l: "Watchouts", c: "#F0DC8C", n: 3 },
                  { l: "Next steps", c: "#1C2B2D", n: 1 },
                ].map(({ l, c, n }) => (
                  <div key={l} className="flex items-center gap-3 rounded-xl px-4 py-2.5 mb-2"
                    style={{ backgroundColor: c + "20" }}>
                    <span className="text-xs font-bold flex-1 text-white">{l}</span>
                    <span className="text-xs opacity-40 text-white">{String(n).padStart(2, "0")}</span>
                  </div>
                ))}
              </div>
              {/* Right — copy */}
              <div>
                <p className="label-eyebrow mb-3" style={{ color: "var(--orange)" }}>Live example</p>
                <h3 className="text-2xl font-extrabold mb-3 text-white"
                  style={{ fontFamily: "var(--font-bricolage),sans-serif" }}>
                  A real brief, ready for a real call.
                </h3>
                <p className="text-sm opacity-60 text-white leading-relaxed mb-6">
                  This is what PreConvara generates from a company name, website URL, and a few notes. Every section is labelled by source so you know what's confirmed and what needs clarifying.
                </p>
                <Link href={user ? "/dashboard/create" : "/signup"}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:shadow-lg"
                  style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
                  Try it now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="how" className="py-20 scroll-reveal" style={{ backgroundColor: "var(--teal-dark)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="label-eyebrow mb-3" style={{ color: "var(--orange)" }}>How it works</p>
            <h2 className="text-white" style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800 }}>
              From rough notes to ready brief.<br />Under a minute.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: "01", icon: <MessageSquare className="w-6 h-6" />, title: "Paste context", desc: "Client name, any notes or emails — even half-formed thoughts work." },
              { n: "02", icon: <Globe className="w-6 h-6" />,         title: "Add website", desc: "Optional but powerful. We fetch and analyse it server-side." },
              { n: "03", icon: <Zap className="w-6 h-6" />,           title: "Choose call type", desc: "Discovery, Kickoff, Review, or Handoff — the brief adapts." },
              { n: "04", icon: <CheckCircle2 className="w-6 h-6" />,  title: "Get your brief", desc: "12 sections, source-labelled, ready to read in 2 minutes." },
            ].map(({ n, icon, title, desc }, i) => (
              <div key={n} className={`scroll-reveal scroll-reveal-delay-${i + 1} group`}>
                <div className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold opacity-40 text-white">{n}</span>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: "var(--orange)", color: "#fff" }}>{icon}</div>
                  </div>
                  <p className="font-bold text-sm mb-2 text-white"
                    style={{ fontFamily: "var(--font-bricolage),sans-serif" }}>{title}</p>
                  <p className="text-xs leading-relaxed opacity-60 text-white">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials marquee ─────────────────────────────────────────────── */}
      <section className="py-16 overflow-hidden scroll-reveal">
        <div className="text-center mb-10">
          <p className="label-eyebrow mb-2">Loved by freelancers</p>
          <h2 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800, color: "var(--text-primary)" }}>
            What people are saying
          </h2>
        </div>
        <div className="relative overflow-hidden" style={{ maskImage: "linear-gradient(to right,transparent,black 8%,black 92%,transparent)" }}>
          <div className="flex gap-4 anim-marquee" style={{ width: "max-content" }}>
            {[...Array(2)].flatMap((_, si) =>
              [
                { name: "Alex W.", role: "Freelance developer", quote: "I used to spend 30 minutes prepping. Now it's 2 minutes. Genuinely changed how I sell." },
                { name: "Priya K.", role: "Independent studio", quote: "The questions it surfaces are better than what I'd come up with under pressure." },
                { name: "James L.", role: "Small agency", quote: "Walked into a discovery call with a 12-section brief. Client was visibly impressed." },
                { name: "Sarah M.", role: "Freelance designer", quote: "The website analysis alone is worth it. Catches things I'd never notice manually." },
                { name: "Tom H.", role: "Web consultant", quote: "Finally something that understands the freelance sales workflow." },
                { name: "Nina R.", role: "Digital agency", quote: "We use it before every pitch. Win rate has noticeably improved." },
              ].map(({ name, role, quote }, qi) => (
                <div key={`${si}-${qi}`}
                  className="w-72 shrink-0 rounded-2xl p-5 transition-all hover:shadow-md hover:scale-[1.02] cursor-default"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: "var(--orange)" }} />)}
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>"{quote}"</p>
                  <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{role}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Integrations grid ────────────────────────────────────────────────── */}
      <section id="integrations" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 scroll-reveal">
        <div className="text-center mb-10">
          <p className="label-eyebrow mb-3">Roadmap</p>
          <h2 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800, color: "var(--text-primary)" }}>
            Deeper integrations coming soon
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Mail className="w-5 h-5" />,      label: "Gmail",           desc: "Pull email threads",        live: false, inProgress: true  },
            { icon: <Calendar className="w-5 h-5" />,  label: "Google Calendar", desc: "One-click follow-up events", live: true,  inProgress: false },
            { icon: <Phone className="w-5 h-5" />,     label: "WhatsApp",        desc: "Send brief to your phone",   live: true,  inProgress: false },
            { icon: <BarChart3 className="w-5 h-5" />, label: "HubSpot",         desc: "CRM sync",                  live: false, inProgress: false },
            { icon: <Users className="w-5 h-5" />,     label: "Salesforce",      desc: "Enterprise CRM",            live: false, inProgress: false },
            { icon: <Zap className="w-5 h-5" />,       label: "Stripe",          desc: "Subscription billing",      live: false, inProgress: false },
            { icon: <Users className="w-5 h-5" />,     label: "Slack",           desc: "AI summaries in channel",   live: false, inProgress: true  },
            { icon: <BarChart3 className="w-5 h-5" />, label: "Analytics",       desc: "Call outcomes",             live: false, inProgress: false },
          ].map(({ icon, label, desc, live, inProgress }, i) => (
            <div key={label}
              className={`scroll-reveal scroll-reveal-delay-${(i % 4) + 1} group rounded-2xl p-4 transition-all hover:shadow-md hover:scale-[1.03] cursor-default`}
              style={{ backgroundColor: "var(--bg-card)", border: `1px solid ${live ? "rgba(5,150,105,0.3)" : inProgress ? "rgba(37,99,235,0.25)" : "var(--border-light)"}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: live ? "rgba(5,150,105,0.1)" : inProgress ? "rgba(37,99,235,0.1)" : "rgba(28,43,45,0.06)" }}>
                  <span style={{ color: live ? "#059669" : inProgress ? "#2563EB" : "var(--teal)" }}>{icon}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={live
                    ? { backgroundColor: "#E8F5E4", color: "#2D7A3A" }
                    : inProgress
                    ? { backgroundColor: "#EFF6FF", color: "#1D4ED8" }
                    : { backgroundColor: "#FEF9C3", color: "#854D0E" }
                  }>
                  {live ? "Live" : inProgress ? "Beta" : "Soon"}
                </span>
              </div>
              <p className="text-sm font-bold mb-0.5" style={{ fontFamily: "var(--font-bricolage),sans-serif", color: "var(--text-primary)" }}>{label}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ + CTA combined dark section ─────────────────────────────────── */}
      <section id="faq" className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 scroll-reveal">
        <div className="relative rounded-3xl overflow-hidden"
          style={{ backgroundColor: "var(--teal-dark)" }}>
          {/* Background blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ backgroundColor: "var(--orange)", opacity: 0.07, filter: "blur(60px)", transform: "translate(30%,-30%)" }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ backgroundColor: "var(--teal-light)", opacity: 0.08, filter: "blur(70px)", transform: "translate(-30%,30%)" }} />

          <div className="relative grid grid-cols-1 lg:grid-cols-2">

            {/* Left — FAQ accordion */}
            <div className="px-6 sm:px-10 py-10 border-b lg:border-b-0 lg:border-r"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="label-eyebrow mb-3" style={{ color: "var(--orange)" }}>Got questions?</p>
              <h2 className="text-white mb-7"
                style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800 }}>
                Frequently asked<br />questions.
              </h2>
              <FaqAccordion />
            </div>

            {/* Right — CTA */}
            <div className="px-6 sm:px-10 py-10 flex flex-col justify-center">
              <p className="label-eyebrow mb-4" style={{ color: "var(--orange)" }}>Start today</p>
              <h2 className="mb-4 text-white"
                style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, lineHeight: 1.1 }}>
                Ready for your<br />next call?
              </h2>
              <p className="mb-8 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                Create your first brief free.<br />No card required. No complex setup.
              </p>
              <div className="flex flex-col gap-3">
                {user ? (
                  <Link href="/dashboard"
                    className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.03] hover:shadow-2xl"
                    style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
                    Go to your dashboard <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <>
                    <Link href="/signup"
                      className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.03] hover:shadow-2xl"
                      style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
                      Create workspace free
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link href="/login"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-70"
                      style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      Sign in to your workspace
                    </Link>
                  </>
                )}
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap gap-3">
                {["Free forever plan", "No credit card", "30-second setup"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                    <CheckCircle2 className="w-3 h-3" style={{ color: "var(--orange)" }} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t pt-14 pb-10" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Top row: logo + columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <PreConvaraLogo size={30} />
              <p className="mt-3 text-xs leading-relaxed max-w-[180px]" style={{ color: "var(--text-muted)" }}>
                Prepare for better client conversations.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>
                Product
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  { label: "Features",      href: "/#features" },
                  { label: "How it works",  href: "/#how" },
                  { label: "Integrations",  href: "/#integrations" },
                  { label: "FAQ",           href: "/#faq" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="hover:underline transition-opacity hover:opacity-70"
                      style={{ color: "var(--text-secondary)" }}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>
                Resources
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  { label: "Help Center",  href: "/help" },
                  { label: "Contact",      href: "/contact" },
                  { label: "Sign up free", href: "/signup" },
                  { label: "Sign in",      href: "/login" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="hover:underline transition-opacity hover:opacity-70"
                      style={{ color: "var(--text-secondary)" }}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>
                Legal
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  { label: "Privacy Policy",  href: "/legal/privacy" },
                  { label: "Terms of Service",href: "/legal/terms" },
                  { label: "Cookie Policy",   href: "/legal/cookies" },
                  { label: "AI Policy",       href: "/legal/ai-policy" },
                  { label: "Security",        href: "/legal/security" },
                  { label: "DPA",             href: "/legal/dpa" },
                  { label: "Subprocessors",   href: "/legal/subprocessors" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="hover:underline transition-opacity hover:opacity-70"
                      style={{ color: "var(--text-secondary)" }}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderColor: "var(--border-light)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              © {new Date().getFullYear()} PreConvara. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              AI-powered meeting preparation for freelance web developers &amp; digital agencies.
            </p>
          </div>
        </div>
      </footer>

      {/* AI chat available on landing too */}
      <AiChatWidget />
    </div>
  );
}
