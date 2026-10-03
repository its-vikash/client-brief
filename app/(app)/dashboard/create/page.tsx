"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, Search, ArrowUpRight, FileText, PenLine } from "lucide-react";
import { generateBrief, analyzeWebsite } from "@/lib/api";
import { saveBrief, saveDraft, getBriefById, updateDraftInPlace, updateBriefInPlace } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import Spinner from "@/components/Spinner";
import WebsiteResearchPanel from "@/components/WebsiteResearchPanel";
import type { BriefFormData, WebsiteResearch } from "@/types";
import clsx from "clsx";

// ── Call types ────────────────────────────────────────────────────────────────

const CALL_TYPES = [
  { value: "Discovery", label: "Discovery", sub: "Find the shape of the work" },
  { value: "Kickoff",   label: "Kickoff",   sub: "Align the people and plan"  },
  { value: "Review",    label: "Review",    sub: "Share work, gather signal"  },
  { value: "Handoff",   label: "Handoff",   sub: "Close the loop with care"   },
  { value: "Other",     label: "Other",     sub: "Something a little different" },
];

const SERVICES = [
  "New Website Design & Development",
  "Website Redesign",
  "E-commerce Development",
  "Landing Page",
  "Web Application / SaaS",
  "SEO & Performance Optimisation",
  "Website Maintenance & Support",
  "Shopify / WooCommerce Store",
  "Branding & Identity",
  "Other",
];

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#E8652A]/40";
const inputStyle = {
  backgroundColor: "var(--bg-card-alt)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
};

type ResearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; data: WebsiteResearch }
  | { status: "error"; message: string };

// ── Inner form (needs Suspense for useSearchParams) ───────────────────────────

function CreateForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get("edit");

  const [userId, setUserId]         = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl]   = useState("");
  const [service, setService]         = useState("");
  const [callType, setCallType]       = useState("Discovery");
  const [customCallType, setCustomCallType] = useState("");
  const [notes, setNotes]             = useState("");

  const [generating, setGenerating] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [genError, setGenError]     = useState<string | null>(null);
  const [research, setResearch]     = useState<ResearchState>({ status: "idle" });

  // ── Auth + prefill ─────────────────────────────────────────────────────────
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    setUserId(user.id);

    if (!editId) return;
    getBriefById(editId, user.id).then((record) => {
      if (!record) return;
      const { input } = record;
      setCompanyName(input.companyName);
      setWebsiteUrl(input.websiteUrl ?? "");
      setNotes(input.notes ?? "");
      const m = input.service.match(/^(.+?)\s*\((.+?)\s+call\)$/);
      if (m) {
        setService(m[1].trim());
        const ct = CALL_TYPES.find((c) => c.value === m[2].trim());
        if (ct) { setCallType(ct.value); }
        else    { setCallType("Other"); setCustomCallType(m[2].trim()); }
      } else {
        setService(input.service);
      }
    });
  }, [editId]);

  // ── Analyze ────────────────────────────────────────────────────────────────
  async function handleAnalyze() {
    const url = websiteUrl.trim();
    if (!url) return;
    setResearch({ status: "loading" });
    try {
      const data = await analyzeWebsite(url);
      setResearch({ status: "done", data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Website analysis failed.";
      if (msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("api key")) {
        setResearch({ status: "error", message: msg });
      } else {
        setResearch({ status: "done", data: { success: false, failureReason: msg, rawSummary: "" } });
      }
    }
  }

  // ── Build form data ────────────────────────────────────────────────────────
  function buildFormData(): BriefFormData {
    const effectiveCallType = callType === "Other"
      ? (customCallType.trim() || "Other")
      : callType;
    return {
      companyName: companyName.trim(),
      websiteUrl:  websiteUrl.trim(),
      service:     `${service} (${effectiveCallType} call)`,
      notes:       notes.trim(),
    };
  }

  // ── Save as Draft ──────────────────────────────────────────────────────────
  async function handleSaveDraft() {
    if (!companyName.trim() || !userId) {
      setGenError("Client name is required to save a draft.");
      return;
    }
    setSavingDraft(true);
    setGenError(null);
    const websiteResearch = research.status === "done" ? research.data : undefined;
    const formData = buildFormData();

    try {
      let record;
      if (editId) {
        // Editing an existing record — update it in-place, no duplicate created
        const updated = await updateDraftInPlace(userId, editId, formData, websiteResearch);
        record = updated ?? await saveDraft(userId, formData, websiteResearch);
      } else {
        record = await saveDraft(userId, formData, websiteResearch);
      }
      router.push(`/dashboard/brief/${record.id}`);
    } catch {
      setGenError("Could not save draft. Please try again.");
      setSavingDraft(false);
    }
  }

  // ── Generate Brief ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) { setGenError("Client name is required."); return; }
    if (!service)            { setGenError("Please select the service type."); return; }
    if (!userId)             { setGenError("Please sign in again."); return; }

    setGenerating(true);
    setGenError(null);

    const briefFormData    = buildFormData();
    const websiteResearch  = research.status === "done" ? research.data : undefined;

    try {
      const brief = await generateBrief(briefFormData, websiteResearch);
      let record;
      if (editId) {
        // Editing an existing record — update in-place, navigate to same ID
        const updated = await updateBriefInPlace(userId, editId, brief, websiteResearch);
        record = updated ?? await saveBrief(userId, briefFormData, brief, websiteResearch);
        router.push(`/dashboard/brief/${record.id}`);
      } else {
        record = await saveBrief(userId, briefFormData, brief, websiteResearch);
        router.push(`/dashboard/brief/${record.id}`);
      }
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setGenerating(false);
    }
  }

  const isAnalyzing = research.status === "loading";
  const hasUrl      = websiteUrl.trim().length > 0;
  const hasResearch = research.status === "done";
  const isFormReady = companyName.trim() && service;

  const isRateLimit = genError?.toLowerCase().includes("busy") ||
                      genError?.toLowerCase().includes("rate") ||
                      genError?.toLowerCase().includes("quota");

  return (
    <div className="min-h-full px-4 sm:px-10 py-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm mb-8 opacity-50 hover:opacity-100 transition-opacity anim-fade-in"
        style={{ color: "var(--text-secondary)" }}
      >
        <ChevronLeft className="w-4 h-4" />
        Back to overview
      </Link>

      {/* Heading */}
      <div className="mb-9 anim-fade-up">
        <p className="label-eyebrow mb-3">{editId ? "Edit Context" : "New Conversation"}</p>
        <h1 className="heading-hero">
          {editId
            ? <><span>Update the</span><br /><span className="accent">context.</span></>
            : <><span>Start with the</span><br /><span className="accent">rough edges.</span></>
          }
        </h1>
        <p className="mt-4 text-sm max-w-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Give us the context <span style={{ color: "var(--teal)" }}>you have</span>.
          Client notes, half-formed thoughts, the thing they said right before hanging{" "}
          <span style={{ color: "var(--orange)" }}>up</span>.
          We'll turn it into something useful.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6 anim-fade-up-1">

        {/* Client name */}
        <FormField label="Client name" required hint="Who are you meeting?">
          <input
            type="text"
            value={companyName}
            onChange={(e) => { setCompanyName(e.target.value); setGenError(null); }}
            placeholder="e.g. Northstar Ceramics"
            autoFocus
            disabled={generating || savingDraft}
            className={inputClass}
            style={inputStyle}
          />
        </FormField>

        {/* Call type radio cards */}
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            What kind of call is this?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CALL_TYPES.map((ct) => {
              const active = callType === ct.value;
              return (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => { setCallType(ct.value); setGenError(null); }}
                  className="text-left rounded-xl p-3.5 transition-all hover:shadow-sm"
                  style={{
                    backgroundColor: active ? "var(--bg-card-alt)" : "var(--bg-card)",
                    border: active ? "1.5px solid var(--orange)" : "1.5px solid var(--border-light)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {ct.label}
                    </span>
                    <span
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        borderColor: active ? "var(--orange)" : "var(--border)",
                        backgroundColor: active ? "var(--orange)" : "transparent",
                      }}
                    >
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                    </span>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                    {ct.sub}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Custom call type label when "Other" selected */}
          {callType === "Other" && (
            <input
              type="text"
              value={customCallType}
              onChange={(e) => setCustomCallType(e.target.value)}
              placeholder="Describe the call type, e.g. Strategy session"
              disabled={generating || savingDraft}
              className={inputClass + " mt-3"}
              style={inputStyle}
            />
          )}
        </div>

        {/* Service */}
        <FormField label="Service type" required hint="What kind of work are they after?">
          <select
            value={service}
            onChange={(e) => { setService(e.target.value); setGenError(null); }}
            disabled={generating || savingDraft}
            className={clsx(inputClass, !service && "text-[#7A928F]")}
            style={inputStyle}
          >
            <option value="" disabled>Select a service…</option>
            {SERVICES.map((s) => (
              <option key={s} value={s} style={{ color: "var(--text-primary)" }}>{s}</option>
            ))}
          </select>
        </FormField>

        {/* Website URL + Analyze */}
        <FormField label="Website URL" hint="Paste a URL to auto-research the prospect.">
          <div className="flex gap-2">
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => { setWebsiteUrl(e.target.value); setResearch({ status: "idle" }); }}
              placeholder="https://example.com"
              disabled={generating || isAnalyzing || savingDraft}
              className={clsx(inputClass, "flex-1")}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!hasUrl || isAnalyzing || generating || savingDraft}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: hasUrl && !isAnalyzing && !generating ? "var(--teal)" : "var(--border)",
                color: hasUrl && !isAnalyzing && !generating ? "#fff" : "var(--text-muted)",
              }}
            >
              {isAnalyzing ? <Spinner size="sm" light /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline">{isAnalyzing ? "Researching…" : "Analyze"}</span>
            </button>
          </div>
        </FormField>

        {/* Research states */}
        {isAnalyzing && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "var(--bg-card)", color: "var(--teal)" }}>
            <Spinner size="sm" />
            Researching website — about 15 seconds…
          </div>
        )}
        {research.status === "error" && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {research.message}
          </div>
        )}
        {hasResearch && (
          <WebsiteResearchPanel
            research={(research as { status: "done"; data: WebsiteResearch }).data}
            onRegenerate={async () => { setResearch({ status: "loading" }); await handleAnalyze(); }}
            onEdit={(updated) => setResearch({ status: "done", data: updated })}
            isRegenerating={isAnalyzing}
          />
        )}

        {/* Notes */}
        <FormField label="The context" hint="Paste notes, emails, or the loose threads in your head.">
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setGenError(null); }}
              placeholder="They are currently using a Squarespace site but it feels too generic. Jamie cares most about showing the glaze process…"
              rows={6}
              disabled={generating || savingDraft}
              className={clsx(inputClass, "resize-y min-h-[130px]")}
              style={inputStyle}
            />
            <FileText className="absolute top-3 right-3 w-4 h-4 pointer-events-none opacity-20"
              style={{ color: "var(--text-secondary)" }} />
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            ✦ Your notes stay attached to the brief as source context.
          </p>
        </FormField>

        {/* Error */}
        {genError && (
          <div
            className="rounded-xl px-4 py-3.5 text-sm"
            style={{
              backgroundColor: isRateLimit ? "#FFF8F0" : "#FDECEA",
              color: isRateLimit ? "#7A3800" : "#B91C1C",
              border: `1px solid ${isRateLimit ? "#F5C88A" : "#FECACA"}`,
            }}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                {isRateLimit ? (
                  <>
                    <p className="font-semibold mb-1">The AI service is busy right now</p>
                    <p className="text-xs leading-relaxed opacity-80">
                      This clears automatically — wait 30–60 seconds and try again.
                      Your form data is safe.
                    </p>
                  </>
                ) : genError}
              </div>
            </div>
            {isRateLimit && (
              <button
                type="submit"
                disabled={generating || !isFormReady}
                className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--orange)", color: "#fff" }}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* Submit row — Generate + Save as Draft */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Save as Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft || generating || !companyName.trim()}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            {savingDraft ? <Spinner size="sm" /> : <PenLine className="w-4 h-4" />}
            {savingDraft ? "Saving…" : "Save as draft"}
          </button>

          {/* Generate */}
          <button
            type="submit"
            disabled={generating || savingDraft || !isFormReady}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--teal-dark)", color: "var(--text-cream)" }}
          >
            {generating ? (
              <><Spinner size="sm" light />Generating…</>
            ) : (
              <>{editId ? "Regenerate brief" : "Create prep brief"}<ArrowUpRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        {generating && (
          <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
            Generating your brief — about 15–25 seconds…
          </p>
        )}
      </form>
    </div>
  );
}

// ── Page wrapper (Suspense required for useSearchParams) ──────────────────────

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    }>
      <CreateForm />
    </Suspense>
  );
}

// ── FormField helper ──────────────────────────────────────────────────────────

function FormField({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-1.5">
        <span className="block text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
          {label}
          {required && <span className="ml-0.5" style={{ color: "var(--orange)" }}> *</span>}
        </span>
        {hint && (
          <span className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{hint}</span>
        )}
        {children}
      </label>
    </div>
  );
}
