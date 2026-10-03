"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Copy, Check, RefreshCw, Plus, AlertCircle,
  Pencil, Trash2, MessageSquare, HelpCircle, AlertTriangle,
  CheckCircle, Lightbulb, ArrowUpRight, PenLine,
  Calendar, Phone,
} from "lucide-react";
import { getBriefById, updateBriefInPlace, deleteBrief, formatDate } from "@/lib/storage";
import { generateBrief } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import Spinner from "@/components/Spinner";
import BriefCard, { BriefList } from "@/components/BriefCard";
import DeleteModal from "@/components/DeleteModal";
import type { BriefRecord, ClientBrief } from "@/types";

type Accent = "cream" | "orange" | "teal" | "yellow" | "dark" | "green" | "red";

const RIGHT_SECTIONS: {
  key: keyof ClientBrief; title: string; accent: Accent; list: boolean; icon: React.ReactNode;
}[] = [
  { key: "keyTalkingPoints",        title: "Talking points",   accent: "cream",  list: true,  icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { key: "questionsToAsk",          title: "Questions to ask", accent: "teal",   list: true,  icon: <HelpCircle    className="w-3.5 h-3.5" /> },
  { key: "potentialConcerns",       title: "Watchouts",        accent: "yellow", list: true,  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { key: "informationStillMissing", title: "Still missing",    accent: "red",    list: true,  icon: <HelpCircle    className="w-3.5 h-3.5" /> },
  { key: "recommendedNextStep",     title: "Next steps",       accent: "dark",   list: false, icon: <CheckCircle   className="w-3.5 h-3.5" /> },
];

export default function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [userId, setUserId]                   = useState<string | null>(null);
  const [record, setRecord]                   = useState<BriefRecord | null>(null);
  const [notFound, setNotFound]               = useState(false);
  const [copied, setCopied]                   = useState(false);
  const [regenerating, setRegenerating]       = useState(false);
  const [regenError, setRegenError]           = useState<string | null>(null);
  const [calLoading, setCalLoading]     = useState(false);
  const [waLoading, setWaLoading]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/landing"); return; }
    setUserId(user.id);
    getBriefById(id, user.id).then((r) => { if (r) setRecord(r); else setNotFound(true); });
  }, [id, router]);

  const copyBrief = useCallback(async () => {
    if (!record?.brief) return;
    const { brief, input } = record;
    const lines: string[] = [`CLIENT BRIEF — ${input.companyName}`, `Service: ${input.service}`, `Generated: ${formatDate(record.createdAt)}`, ""];
    const textFields: (keyof ClientBrief)[] = ["companyOverview","businessAndIndustry","whatWeKnow","existingDigitalPresence","likelyClientGoals","suggestedMeetingOpening","recommendedNextStep"];
    const listFields: (keyof ClientBrief)[] = ["potentialOpportunities","keyTalkingPoints","questionsToAsk","potentialConcerns","informationStillMissing"];
    for (const k of textFields) { lines.push(`── ${k.toUpperCase()} ──`); lines.push(String(brief[k] ?? "")); lines.push(""); }
    for (const k of listFields) { lines.push(`── ${k.toUpperCase()} ──`); (brief[k] as string[] | undefined)?.forEach((item) => lines.push(`• ${item}`)); lines.push(""); }
    try { await navigator.clipboard.writeText(lines.join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { alert(lines.join("\n")); }
  }, [record]);

  const handleRegenerate = useCallback(async () => {
    if (!record || !userId) return;
    setRegenerating(true); setRegenError(null);
    try {
      const brief = await generateBrief(record.input, record.websiteResearch);
      const updated = await updateBriefInPlace(userId, record.id, brief, record.websiteResearch);
      if (updated) setRecord(updated);
    } catch (err: unknown) {
      setRegenError(err instanceof Error ? err.message : "Regeneration failed.");
    } finally { setRegenerating(false); }
  }, [record, userId]);

  // ── Add to Google Calendar ───────────────────────────────────────────────
  const handleAddToCalendar = useCallback(async () => {
    if (!record) return;
    setCalLoading(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: record.input.companyName,
          service:     record.input.service,
          notes:       record.input.notes,
          briefId:     record.id,
        }),
      });
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } catch { /* silent fail */ }
    finally { setCalLoading(false); }
  }, [record]);

  // ── Send to WhatsApp ─────────────────────────────────────────────────────
  const handleSendWhatsApp = useCallback(async () => {
    if (!record?.brief) return;
    setWaLoading(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName:          record.input.companyName,
          service:              record.input.service,
          companyOverview:      record.brief.companyOverview,
          keyTalkingPoints:     record.brief.keyTalkingPoints,
          questionsToAsk:       record.brief.questionsToAsk,
          suggestedOpening:     record.brief.suggestedMeetingOpening,
          recommendedNextStep:  record.brief.recommendedNextStep,
          briefId:              record.id,
        }),
      });
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } catch { /* silent fail */ }
    finally { setWaLoading(false); }
  }, [record]);

  const executeDelete = useCallback(async () => {
    if (!record || !userId) return;
    await deleteBrief(userId, record.id);
    router.push("/dashboard");
  }, [record, userId, router]);

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p style={{ color: "var(--text-muted)" }}>Brief not found or access denied.</p>
        <Link href="/dashboard" style={{ color: "var(--orange)" }} className="text-sm font-semibold">← Back to overview</Link>
      </div>
    );
  }
  if (!record) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
  }

  const { input } = record;
  const brief = record.brief;
  const isDraft = record.status === "draft";
  const shortVersion = brief?.companyOverview ?? "";
  const desiredOutcome = brief?.likelyClientGoals ?? "";
  const opps = brief?.potentialOpportunities ?? [];
  const isRateLimit = regenError?.toLowerCase().includes("busy") || regenError?.toLowerCase().includes("rate") || regenError?.toLowerCase().includes("quota");

  return (
    <>
      {showDeleteModal && (
        <DeleteModal companyName={input.companyName} onConfirm={executeDelete} onCancel={() => setShowDeleteModal(false)} />
      )}

      <div className="min-h-full px-6 sm:px-10 py-8 max-w-5xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-6 opacity-50 hover:opacity-100 transition-opacity anim-fade-in" style={{ color: "var(--text-secondary)" }}>
          <ChevronLeft className="w-4 h-4" /> Back to overview
        </Link>

        <div className="mb-7 anim-fade-up">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {isDraft ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md" style={{ backgroundColor: "#FEF9C3", color: "#854D0E" }}>
                <PenLine className="w-3 h-3" /> Draft
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md" style={{ backgroundColor: "#E8F5E4", color: "#2D7A3A" }}>
                Ready for your call
              </span>
            )}
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {input.service.split("(")[0].trim()} · {formatDate(record.createdAt)}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage), sans-serif" }}>
            {input.companyName}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: "var(--teal)", color: "#fff" }}>
                {input.companyName.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{input.companyName}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap overflow-x-auto pb-1 -mb-1 max-w-full">
              {!isDraft && (
                <button onClick={copyBrief} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy brief"}
                </button>
              )}
              {!isDraft && (
                <button onClick={handleRegenerate} disabled={regenerating} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm disabled:opacity-40" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
                  Regenerate
                </button>
              )}
              {/* Calendar & WhatsApp — only for ready briefs */}
              {!isDraft && (
                <>
                  <button
                    onClick={handleAddToCalendar}
                    disabled={calLoading}
                    title="Schedule follow-up in Google Calendar"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm disabled:opacity-40"
                    style={{ backgroundColor: "var(--bg-card)", color: "#1967D2", border: "1px solid var(--border)" }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {calLoading ? "Opening…" : "Add to Calendar"}
                  </button>
                  <button
                    onClick={handleSendWhatsApp}
                    disabled={waLoading}
                    title="Send brief summary to WhatsApp"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm disabled:opacity-40"
                    style={{ backgroundColor: "var(--bg-card)", color: "#25D366", border: "1px solid var(--border)" }}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {waLoading ? "Opening…" : "Send to Phone"}
                  </button>
                </>
              )}
              <Link href={`/dashboard/create?edit=${record.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm" style={{ backgroundColor: "var(--bg-card)", color: "var(--teal)", border: "1px solid var(--border)" }}>
                <Pencil className="w-3.5 h-3.5" />
                {isDraft ? "Complete draft" : "Edit context"}
              </Link>              <Link href={`/dashboard/schedule?company=${encodeURIComponent(input.companyName)}&briefId=${record.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm"
                style={{ backgroundColor: "var(--bg-card)", color: "#1967D2", border: "1px solid var(--border)" }}>
                <Calendar className="w-3.5 h-3.5" />
                Schedule call
              </Link>
              <Link href="/dashboard/create" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90" style={{ backgroundColor: "var(--teal-dark)", color: "var(--text-cream)" }}>
                <Plus className="w-3.5 h-3.5" /> New brief
              </Link>
              <button onClick={() => setShowDeleteModal(true)} className="p-1.5 rounded-lg transition-all opacity-30 hover:opacity-80" style={{ color: "#DC2626", border: "1px solid var(--border)" }} title="Delete brief">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {isDraft && (
          <div className="rounded-2xl p-8 text-center anim-fade-up-1" style={{ backgroundColor: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
            <PenLine className="w-10 h-10 mx-auto mb-4 opacity-30" style={{ color: "var(--text-secondary)" }} />
            <h2 className="text-lg font-extrabold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage), sans-serif" }}>This brief is still a draft</h2>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>The context has been saved but no AI brief has been generated yet.</p>
            <Link href={`/dashboard/create?edit=${record.id}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
              <ArrowUpRight className="w-4 h-4" /> Complete this brief
            </Link>
          </div>
        )}

        {!isDraft && brief && (
          <>
            {regenError && (
              <div className="rounded-xl px-4 py-3.5 text-sm mb-6" style={{ backgroundColor: isRateLimit ? "#FFF8F0" : "#FDECEA", color: isRateLimit ? "#7A3800" : "#B91C1C", border: `1px solid ${isRateLimit ? "#F5C88A" : "#FECACA"}` }}>
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    {isRateLimit ? (
                      <><p className="font-semibold mb-1">The AI service is busy right now</p><p className="text-xs opacity-80">Wait 30–60 seconds, then click Regenerate again.</p></>
                    ) : regenError}
                  </div>
                </div>
              </div>
            )}
            {regenerating && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-4 text-sm mb-6" style={{ backgroundColor: "var(--bg-card)", color: "var(--teal)" }}>
                <Spinner size="sm" /> Regenerating brief — 15–25 seconds…
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-5 items-start anim-fade-up-2">
              {/* LEFT — Conversation Map */}
              <div className="space-y-4 w-full lg:w-1/2 shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--orange)" }} />
                  <p className="label-eyebrow" style={{ color: "var(--text-secondary)" }}>Conversation Map</p>
                </div>
                <BriefCard accent="orange">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3 opacity-70 text-white">The Short Version</p>
                  <p className="text-xl font-bold leading-snug text-white" style={{ fontFamily: "var(--font-bricolage), sans-serif" }}>{shortVersion}</p>
                </BriefCard>
                <BriefCard accent="cream">
                  <p className="label-eyebrow mb-3" style={{ color: "var(--orange)" }}>Desired Outcome</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{desiredOutcome}</p>
                </BriefCard>
                {brief.businessAndIndustry && <BriefCard accent="cream"><p className="label-eyebrow mb-3" style={{ color: "var(--teal)" }}>Business & Industry</p><p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{brief.businessAndIndustry}</p></BriefCard>}
                {brief.whatWeKnow && <BriefCard accent="cream"><p className="label-eyebrow mb-3" style={{ color: "var(--teal)" }}>What We Know</p><p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{brief.whatWeKnow}</p></BriefCard>}
                {brief.existingDigitalPresence && <BriefCard accent="cream"><p className="label-eyebrow mb-3" style={{ color: "var(--text-muted)" }}>Digital Presence</p><p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{brief.existingDigitalPresence}</p></BriefCard>}
                {opps.length > 0 && <BriefCard accent="green"><p className="label-eyebrow mb-3" style={{ color: "var(--teal-dark)" }}><Lightbulb className="inline w-3 h-3 mr-1" />Opportunities</p><BriefList items={opps} /></BriefCard>}
                {brief.suggestedMeetingOpening && <BriefCard accent="cream"><p className="label-eyebrow mb-3" style={{ color: "var(--orange)" }}>Suggested Opening</p><p className="text-sm leading-relaxed italic" style={{ color: "var(--text-primary)" }}>"{brief.suggestedMeetingOpening}"</p></BriefCard>}
              </div>

              {/* RIGHT — Useful in the Room */}
              <div className="space-y-4 w-full lg:w-1/2 shrink-0">
                <div className="flex items-center mb-1">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "var(--teal)" }} />
                  <p className="label-eyebrow" style={{ color: "var(--text-secondary)" }}>Useful in the Room</p>
                </div>
                {RIGHT_SECTIONS.map((section) => {
                  const value = brief[section.key];
                  if (!value) return null;
                  const isLight = section.accent === "dark" || section.accent === "orange";
                  return (
                    <BriefCard key={section.key} accent={section.accent} title={section.title} icon={section.icon} count={Array.isArray(value) ? (value as string[]).length : undefined}>
                      {section.list && Array.isArray(value) ? <BriefList items={value as string[]} light={isLight} /> : <p>{String(value)}</p>}
                    </BriefCard>
                  );
                })}
              </div>
            </div>

            {/* Source context */}
            <div className="mt-8 rounded-2xl overflow-hidden anim-fade-up-3" style={{ border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: "var(--bg-card)" }}>
                <Pencil className="w-3.5 h-3.5 opacity-40" style={{ color: "var(--text-secondary)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Source context</span>
                <span className="text-xs ml-1 opacity-50" style={{ color: "var(--text-secondary)" }}>The notes behind this brief</span>
                <Link href={`/dashboard/create?edit=${record.id}`} className="ml-auto text-xs font-semibold inline-flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity" style={{ color: "var(--teal)" }}>
                  Edit context <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="px-5 py-4" style={{ backgroundColor: "var(--bg-card-alt)" }}>
                <p className="label-eyebrow mb-2">Call Details</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{input.service}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{formatDate(record.createdAt)}</p>
                {input.notes && <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{input.notes}</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
