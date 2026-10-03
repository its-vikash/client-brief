"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import PreConvaraLogo from "@/components/PreConvaraLogo";
import AiChatWidget from "@/components/AiChatWidget";

const FAQS: { id: string; category: string; items: { q: string; a: string; id?: string }[] }[] = [
  {
    id: "getting-started",
    category: "Getting started",
    items: [
      { q: "What is PreConvara?", a: "PreConvara is an AI-powered meeting preparation tool for freelance web developers and small digital agencies. It turns a client name, website URL, and your notes into a structured 12-section brief — talking points, questions to ask, watchouts — in under 30 seconds." },
      { q: "How do I create my first brief?", a: "Sign up for a free account, then click 'New brief' from your dashboard. Enter the client name, choose the call type (Discovery, Kickoff, Review, etc.), optionally add their website URL, add any notes you have, then click Generate." },
      { q: "Do I need an account?", id: "account", a: "Yes — a free account is required so your briefs are saved securely and are only visible to you. Signup takes under 30 seconds with just your name, email, and a password." },
    ],
  },
  {
    id: "call-types",
    category: "Call types",
    items: [
      { q: "What are the different call types?", a: "Discovery: exploring the project scope and client needs. Kickoff: aligning on the plan after the project is agreed. Review: sharing work and gathering feedback. Handoff: closing the project or delivering final assets. Other: for anything that doesn't fit neatly — you can describe it yourself." },
      { q: "Does the call type affect the brief?", a: "Yes — the AI adapts the talking points, questions, and suggested opening based on the call type. A Kickoff brief focuses on aligning on deliverables, while a Discovery brief focuses on understanding the problem." },
    ],
  },
  {
    id: "sections",
    category: "Brief sections",
    items: [
      { q: "What sections does a brief contain?", a: "A generated brief has 12 sections: Company Overview, Business & Industry, What We Know, Existing Digital Presence, Likely Client Goals, Potential Opportunities, Key Talking Points, Questions to Ask, Potential Concerns, Information Still Missing, Suggested Meeting Opening, and Recommended Next Step." },
      { q: "What do the source labels mean?", id: "labels", a: "[From Website] = information found on the prospect's actual website. [From User Notes] = something you explicitly stated in your notes. [AI Observation] = a reasonable inference, clearly flagged so you know it needs verification. [Needs Confirmation] = an important gap to fill on the call." },
      { q: "What is 'The Short Version'?", a: "It's the orange hero card — a 2–3 sentence summary you can read in 10 seconds right before dialling in. The most important card in the brief." },
    ],
  },
  {
    id: "drafts",
    category: "Drafts",
    items: [
      { q: "What is a draft brief?", a: "A draft is a brief where you've saved the context (client name, notes, URL) but haven't generated the AI output yet. Click 'Save as draft' to preserve your inputs and come back later." },
      { q: "How do I complete a draft?", a: "Open the draft from your dashboard and click 'Complete draft' or 'Edit context'. This opens the create form prefilled with your saved data — then click Generate." },
    ],
  },
  {
    id: "website",
    category: "Website analysis",
    items: [
      { q: "How does the website analyzer work?", a: "When you enter a URL and click Analyze, our server fetches the page and extracts business information — services, messaging, calls-to-action, and opportunities. This is fed into your brief automatically, making talking points much more specific to that actual business." },
      { q: "Why did my website analysis fail?", a: "Common reasons: the site requires login, it's JavaScript-rendered with no readable HTML, it's offline, or it responded too slowly (10-second timeout). When analysis fails, you can still generate a great brief using your manual notes." },
    ],
  },
  {
    id: "calendar",
    category: "Google Calendar",
    items: [
      { q: "How does Add to Calendar work?", a: "Clicking 'Add to Calendar' on a ready brief opens Google Calendar in a new tab with a follow-up event pre-filled — including the client name, service type, a link back to the brief, and a date 7 days from now. You can edit all details before saving. No Google account connection is required on our side." },
    ],
  },
  {
    id: "whatsapp",
    category: "WhatsApp",
    items: [
      { q: "How do I send a brief to WhatsApp?", a: "Click 'Send to Phone' on any ready brief. This opens WhatsApp with a pre-formatted message containing the brief summary — overview, talking points, questions, suggested opening, and a link to the full brief. You can send it to yourself or anyone else." },
    ],
  },
  {
    id: "ai-create",
    category: "AI Create & Transcripts",
    items: [
      { q: "What is AI Create?", a: "AI Create (/dashboard/create-doc) turns any transcript, interview, or notes into a polished document. Pick from 7 templates: Meeting Summary, Follow-up Email, Next Meeting Agenda, Project Document, Customer Feedback Report, Interview Scorecard, Priorities List — or write a custom prompt. Choose a design (Professional, Minimal, Dark) and download a styled HTML file." },
      { q: "What is the Transcripts feature?", a: "Dashboard → Transcripts lets you upload a .txt/.md/.srt/.vtt file or paste raw text. The AI extracts: Executive Summary, Key Points, Decisions, Action Items (owner + due date), Open Questions, Participants, Sentiment, and Next Steps." },
      { q: "What is Ask AI?", a: "Dashboard → Ask AI is a free-form work assistant. Use quick-prompt shortcuts or type your own request for priority lists, roadmaps, client emails, proposals, invoice reminders, pricing guides, and more. Add project context to make answers specific to your situation." },
    ],
  },
  {
    id: "gmail-slack",
    category: "Gmail & Slack",
    items: [
      { q: "How do I connect Gmail?", a: "Go to Dashboard → Gmail. Follow the setup guide: enable the Gmail API in Google Cloud, create OAuth credentials with the correct redirect URI, then click 'Connect Gmail'. Once connected, search for email threads by company name and get AI summaries automatically." },
      { q: "How do I connect Slack?", a: "Go to Dashboard → Slack. Add SLACK_BOT_TOKEN (starts with xoxb-) and SLACK_DEFAULT_CHANNEL to your .env.local, then restart the server. The status badge will show 'Connected'. Select any ready brief and click 'Send to Slack'." },
      { q: "Why does Slack say 'not_in_channel'?", a: "The bot needs to be in the channel before it can post. In Slack, open the channel and type /invite @YourBotName. Then try sending again." },
    ],
  },
];

export default function FAQPage() {
  // Read hash on mount and auto-open the matching item
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1); // e.g. "labels" from "#labels"
    if (!hash) return;

    // Find the first item whose section id or item id matches the hash
    for (const section of FAQS) {
      if (section.id === hash) {
        // Open first item of the section
        setOpen(`${section.id}-0`);
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        return;
      }
      for (let i = 0; i < section.items.length; i++) {
        if (section.items[i].id === hash) {
          setOpen(`${section.id}-${i}`);
          setTimeout(() => {
            document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
          return;
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-canvas)" }}>
      {/* Nav */}
      <nav className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/"><PreConvaraLogo size={28} /></Link>
          <div className="flex items-center gap-4">
            <Link href="/help" className="text-sm hover:underline" style={{ color: "var(--text-muted)" }}>Help Center</Link>
            <Link href="/" className="text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-secondary)" }}>← Home</Link>
          </div>
        </div>
      </nav>

      {/* Heading */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <p className="label-eyebrow mb-3">Support</p>
        <h1 style={{ fontFamily: "var(--font-bricolage),sans-serif", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, lineHeight: 1.1, color: "var(--text-primary)" }}>
          Frequently asked<br /><span style={{ color: "var(--orange)" }}>questions.</span>
        </h1>
        <p className="mt-3 text-sm max-w-lg" style={{ color: "var(--text-secondary)" }}>
          Everything you need to know about PreConvara. Use the AI chat in the bottom-right for instant answers, or{" "}
          <Link href="/contact" className="underline" style={{ color: "var(--teal)" }}>contact support</Link>.
        </p>
      </div>

      {/* FAQ sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-8">
        {FAQS.map((section) => (
          <div key={section.id} id={section.id}>
            <p className="label-eyebrow mb-4" style={{ color: "var(--text-muted)" }}>{section.category}</p>
            <div className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              {section.items.map(({ q, a }, i) => {
                const key = `${section.id}-${i}`;
                return (
                  <div key={key} className="border-b last:border-0" style={{ borderColor: "var(--border-light)" }}>
                    <button onClick={() => setOpen(open === key ? null : key)}
                      className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.02]">
                      <span className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{q}</span>
                      <ChevronDown className="w-4 h-4 shrink-0 mt-0.5 transition-transform"
                        style={{ color: "var(--text-muted)", transform: open === key ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </button>
                    {open === key && (
                      <div className="px-5 pb-5 pr-14">
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ backgroundColor: "var(--teal-dark)" }}>
          <div className="flex-1">
            <p className="font-bold text-sm text-white mb-1"
              style={{ fontFamily: "var(--font-bricolage),sans-serif" }}>Still have questions?</p>
            <p className="text-xs opacity-60 text-white">Our AI assistant can answer most questions instantly.</p>
          </div>
          <Link href="/contact"
            className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
            Contact support
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
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
