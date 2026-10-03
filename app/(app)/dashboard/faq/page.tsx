"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronDown, Sparkles, MessageSquare } from "lucide-react";

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQS: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Getting started",
    items: [
      {
        q: "What is PreConvara?",
        a: "PreConvara is an AI-powered meeting preparation tool for freelance web developers and small digital agencies. It turns basic client information — company name, website, and your notes — into a structured brief with talking points, questions to ask, potential concerns, and a suggested meeting opening. All in under 30 seconds.",
      },
      {
        q: "How do I create my first brief?",
        a: "Click 'New brief' in the sidebar or dashboard. Enter the client name (required), choose the call type (Discovery, Kickoff, Review, etc.), select the service type, optionally paste the client's website URL and your notes, then click 'Create prep brief'. The AI generates your brief in 15–25 seconds.",
      },
      {
        q: "Do I need an account to use PreConvara?",
        a: "Yes — a free account is required so your briefs are saved securely and only visible to you. Signup takes under 30 seconds with just your name, email, and a password.",
      },
    ],
  },
  {
    category: "Generating briefs",
    items: [
      {
        q: "What information should I provide for the best brief?",
        a: "The more context you give, the sharper the brief. At minimum: client name and service type. The most useful briefs come from also providing: the prospect's website URL (we'll analyse it automatically), any emails or notes from previous conversations, and specific requirements they've mentioned. Even incomplete notes are useful — the AI works with whatever you have.",
      },
      {
        q: "What does 'Analyze Website' do?",
        a: "When you enter a website URL and click Analyze, PreConvara fetches the page server-side and extracts key business information — what the company does, their services, calls-to-action, existing website features, and potential opportunities. This research is then fed to the AI when generating your brief, making the talking points and questions much more specific to that actual business.",
      },
      {
        q: "What are the different call types?",
        a: "Discovery: exploring the project scope and understanding what the client needs. Kickoff: aligning on the plan after the project has been agreed. Review: sharing work and gathering feedback. Handoff: closing the project or handing over deliverables. Other: for anything that doesn't fit neatly into those categories — you can describe it yourself.",
      },
      {
        q: "What does 'Regenerate' do?",
        a: "Regenerate calls the AI again with the same client information and produces a fresh version of the brief. It overwrites the existing brief in-place — no duplicate is created and the URL stays the same. Useful when you want a different angle or when the first generation felt too generic.",
      },
      {
        q: "What is a draft brief?",
        a: "A draft is a brief where you've saved the context (client name, notes, URL) but haven't generated the AI brief yet. Click 'Save as draft' to preserve your inputs and come back later. Drafts appear in your brief list with a yellow 'Draft' badge. Click 'Complete draft' or 'Edit context' to open the form and generate the brief.",
      },
    ],
  },
  {
    category: "Brief sections",
    items: [
      {
        q: "What do the source labels mean? ([From Website], [From User Notes], [AI Observation])",
        a: "[From Website] means the information was found on the prospect's actual website during analysis. [From User Notes] means you explicitly provided it in your notes or context. [AI Observation] means it's a reasonable inference the AI made — flagged so you know it needs verification. [Needs Confirmation] means it's an important gap you should fill on the call.",
      },
      {
        q: "What is 'The Short Version'?",
        a: "The Short Version is the orange hero card at the top of your brief — a 2–3 sentence summary of the situation that you can read in 10 seconds right before dialling in. It's the most important card in the brief.",
      },
      {
        q: "What is 'Desired Outcome'?",
        a: "The Desired Outcome section describes what the client likely wants to achieve from this specific engagement — not just the project, but the business goal behind it. It's an AI observation based on the context you provided, so verify it on the call.",
      },
    ],
  },
  {
    category: "Integrations",
    items: [
      {
        q: "How does 'Add to Calendar' work?",
        a: "Clicking 'Add to Calendar' on a ready brief opens Google Calendar in a new tab with a follow-up event pre-filled — including the company name, service type, a link back to the brief, and a default date 7 days from now. You can edit the date and details before saving. No Google account connection is required on our side.",
      },
      {
        q: "How does 'Send to Phone' work?",
        a: "Clicking 'Send to Phone' opens WhatsApp (on your phone or WhatsApp Web) with a pre-formatted message containing the brief summary — overview, talking points, questions, suggested opening, and a link to the full brief. You can send it to yourself, a colleague, or anyone else.",
      },
      {
        q: "How do I connect Gmail?",
        a: "Go to Dashboard → Gmail (in the sidebar). Follow the setup guide — it takes about 10 minutes. You'll need to create a Google Cloud project, enable the Gmail API, and add your OAuth credentials to .env.local. Once connected, you can pull and AI-summarise email threads for any company.",
      },
      {
        q: "How do I connect Slack?",
        a: "Go to Dashboard → Slack (in the sidebar). Follow the 5-minute setup guide to create a Slack App, add the chat:write scope, and add your bot token to .env.local. Once connected, any ready brief can be sent as an AI-formatted summary to any channel.",
      },
      {
        q: "What integrations are live vs coming soon?",
        a: "Live now: Google Calendar (one-click follow-up events), WhatsApp (send brief to phone), Gmail (pull email threads, needs OAuth setup), Slack (send summaries to channel, needs bot token setup). Coming soon: HubSpot, Salesforce CRM sync, Stripe subscriptions, team accounts.",
      },
    ],
  },
  {
    category: "AI Create & Transcripts",
    items: [
      {
        q: "What is AI Create?",
        a: "AI Create (Dashboard → AI Create) turns any meeting transcript, interview recording, or notes into a polished document. Choose from 7 built-in templates — Meeting Summary, Follow-up Email, Next Meeting Agenda, Project Document, Customer Feedback Report, Interview Scorecard, Priorities List — or write your own custom prompt. You can also choose a document design (Professional, Minimal, Dark) and download a styled HTML file.",
      },
      {
        q: "What is the Transcripts feature?",
        a: "Dashboard → Transcripts lets you upload a .txt, .md, .srt, or .vtt file, or paste raw text. The AI extracts a structured summary including: Executive Summary, Key Points, Decisions Made, Action Items (with owner and due date), Open Questions, Participants, Sentiment, and Next Steps.",
      },
      {
        q: "Why do I see ## ** | characters in the output?",
        a: "That shouldn't happen — the AI output is now rendered as formatted HTML with proper headings, bold text, and tables. If you see raw Markdown symbols, try refreshing the page. The Copy button copies clean plain text, and Download gives you a fully styled HTML document.",
      },
    ],
  },
  {
    category: "Ask AI",
    items: [
      {
        q: "What is Ask AI?",
        a: "Ask AI (Dashboard → Ask AI) is a free-form AI assistant for any work task. Use it to generate priority lists, product roadmaps, client emails (follow-up, proposals, delay notifications, invoice reminders), service pricing guides, onboarding checklists, and case study templates. Use the quick-prompt shortcuts to get started instantly, or type your own request.",
      },
      {
        q: "How is Ask AI different from the chat widget?",
        a: "The chat widget (floating button, bottom-right) is scoped to answering questions about PreConvara itself. Ask AI (/dashboard/ask) is a full work assistant — it produces ready-to-use documents, emails, and plans. Ask AI also lets you add project context (client name, budget, timeline) so answers are specific to your situation.",
      },
    ],
  },
  {
    category: "Account & data",
    items: [
      {
        q: "Are my briefs private?",
        a: "Yes. Every brief is associated with your user account and only visible to you. No other user can access your briefs — even if they know the brief URL. When Supabase is connected, Row Level Security enforces this at the database level.",
      },
      {
        q: "How do I change my password?",
        a: "Go to the login page and click 'Forgot password?' to change your password. You'll need to verify your current password before setting a new one.",
      },
      {
        q: "How many briefs can I save?",
        a: "Up to 50 briefs per account. The dashboard shows 5 briefs per page with pagination. The 'Coming Up' panel on the dashboard shows your 3 most recent ready briefs.",
      },
      {
        q: "Is my API key secure?",
        a: "Yes. The Gemini API key is stored only as a server-side environment variable and never exposed to the browser — not in JavaScript bundles, API responses, or any client-side code. All AI requests go through our secure server routes.",
      },
    ],
  },
  {
    category: "Appointments",
    items: [
      {
        q: "What is appointment scheduling?",
        a: "The Schedule page lets you set up your availability and let clients book a call with you. You define your available time slots, and the system generates a booking link you can share. When a client books, you receive the details and a calendar event is created automatically.",
      },
      {
        q: "Can I connect my Google Calendar for scheduling?",
        a: "Full two-way Google Calendar OAuth sync is on the roadmap. Currently, the 'Add to Calendar' button on each brief generates a one-click Google Calendar event for your own follow-ups.",
      },
    ],
  },
];

// ── Accordion item ────────────────────────────────────────────────────────────

function AccordionItem({ q, a, isOpen, onToggle }: {
  q: string; a: string; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div
      className="border-b last:border-b-0"
      style={{ borderColor: "var(--border-light)" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-4 text-left transition-opacity hover:opacity-80"
      >
        <span
          className="text-sm font-semibold leading-snug"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          {q}
        </span>
        <ChevronDown
          className="w-4 h-4 shrink-0 mt-0.5 transition-transform"
          style={{
            color: "var(--text-muted)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {isOpen && (
        <div className="pb-4 pr-8">
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            {a}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>("getting-started-0");

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="min-h-full px-6 sm:px-10 py-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm mb-8 opacity-50 hover:opacity-100 transition-opacity anim-fade-in"
        style={{ color: "var(--text-secondary)" }}
      >
        <ChevronLeft className="w-4 h-4" /> Back to overview
      </Link>

      {/* Heading */}
      <div className="mb-10 anim-fade-up">
        <p className="label-eyebrow mb-3">Help centre</p>
        <h1
          style={{
            fontFamily: "var(--font-bricolage), sans-serif",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            color: "var(--text-primary)",
          }}
        >
          Frequently asked<br />
          <span style={{ color: "var(--orange)" }}>questions.</span>
        </h1>
        <p
          className="mt-4 text-sm max-w-md leading-relaxed"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          Everything you need to know about PreConvara. Can't find what you're looking for? Use the AI chat in the bottom-right corner.
        </p>
      </div>

      {/* FAQ sections */}
      <div className="space-y-6 anim-fade-up-1">
        {FAQS.map((section) => {
          const slug = section.category.toLowerCase().replace(/\s+/g, "-");
          return (
            <div
              key={section.category}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
            >
              {/* Category header */}
              <div
                className="px-5 py-3.5 border-b"
                style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
              >
                <p
                  className="label-eyebrow"
                  style={{ color: "var(--text-muted)" }}
                >
                  {section.category}
                </p>
              </div>

              {/* Items */}
              <div className="px-5">
                {section.items.map((item, idx) => {
                  const key = `${slug}-${idx}`;
                  return (
                    <AccordionItem
                      key={key}
                      q={item.q}
                      a={item.a}
                      isOpen={openKey === key}
                      onToggle={() => toggle(key)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Still have questions CTA */}
      <div
        className="mt-10 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 anim-fade-up-2"
        style={{ backgroundColor: "var(--teal-dark)" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--orange)" }}
        >
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p
            className="font-bold text-sm mb-0.5"
            style={{ color: "var(--text-cream)", fontFamily: "var(--font-bricolage), sans-serif" }}
          >
            Still have questions?
          </p>
          <p
            className="text-xs leading-relaxed opacity-60"
            style={{ color: "var(--text-cream)", fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Use the AI assistant in the bottom-right corner — it knows everything about PreConvara and can help you right now.
          </p>
        </div>
        <div
          className="flex items-center gap-2 shrink-0 text-xs font-semibold px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: "var(--orange)", color: "#fff" }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ask AI
        </div>
      </div>
    </div>
  );
}
