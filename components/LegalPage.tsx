// ── Shared layout component for all legal/static pages ───────────────────────

import Link from "next/link";
import PreConvaraLogo from "@/components/PreConvaraLogo";

interface Section {
  heading: string;
  body: React.ReactNode;
}

interface LegalPageProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  sections: Section[];
}

export default function LegalPage({ title, subtitle, lastUpdated, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-canvas)" }}>
      {/* Top nav */}
      <nav className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/"><PreConvaraLogo size={28} /></Link>
          <Link href="/"
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-secondary)" }}>
            ← Back to home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-8 border-b"
        style={{ borderColor: "var(--border-light)" }}>
        <p className="label-eyebrow mb-3">Legal</p>
        <h1 style={{
          fontFamily: "var(--font-bricolage), sans-serif",
          fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
          fontWeight: 800, lineHeight: 1.1, color: "var(--text-primary)",
        }}>{title}</h1>
        {subtitle && (
          <p className="mt-3 text-sm leading-relaxed max-w-lg"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
            {subtitle}
          </p>
        )}
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Last updated: {lastUpdated}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {sections.map(({ heading, body }) => (
          <section key={heading}>
            <h2 className="text-base font-bold mb-3"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage), sans-serif" }}>
              {heading}
            </h2>
            <div className="text-sm leading-relaxed space-y-3"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
              {body}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-10" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <PreConvaraLogo size={24} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} PreConvara. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-xs justify-center" style={{ color: "var(--text-muted)" }}>
            <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
            <Link href="/legal/terms" className="hover:underline">Terms</Link>
            <Link href="/legal/cookies" className="hover:underline">Cookies</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
