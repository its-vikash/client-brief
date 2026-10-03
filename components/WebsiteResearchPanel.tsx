"use client";

import { useState } from "react";
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Pencil,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Megaphone,
  Layers,
  Lightbulb,
  HelpCircle,
  MousePointerClick,
  LayoutDashboard,
} from "lucide-react";
import Spinner from "@/components/Spinner";
import type { WebsiteResearch } from "@/types";
import clsx from "clsx";

interface WebsiteResearchPanelProps {
  research: WebsiteResearch;
  onRegenerate: () => void;
  onEdit: (updated: WebsiteResearch) => void;
  isRegenerating: boolean;
}

export default function WebsiteResearchPanel({
  research,
  onRegenerate,
  onEdit,
  isRegenerating,
}: WebsiteResearchPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(research.rawSummary);

  function saveEdit() {
    onEdit({ ...research, rawSummary: editText });
    setEditing(false);
  }

  // ── Failure state ──────────────────────────────────────────────────────────

  if (!research.success) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 mb-1">
              Website research could not be completed
            </p>
            <p className="text-amber-700 leading-relaxed">
              {research.failureReason}
            </p>
            <p className="text-amber-600 mt-2">
              You can still generate the brief using the information you've
              entered manually.
            </p>
          </div>
        </div>
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="mt-3 inline-flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          style={{ color: "var(--orange)", border: "1px solid var(--border)", backgroundColor: "var(--bg-card-alt)" }}
        >
          {isRegenerating ? (
            <Spinner size="sm" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Try Again
        </button>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-800">
            Website Research Complete
          </span>
          {research.businessName && (
            <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              {research.businessName}
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-emerald-600 hover:text-emerald-800 transition-colors p-1"
          aria-label={expanded ? "Collapse research" : "Expand research"}
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Summary */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Summary
            </p>
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="text-xs font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditText(research.rawSummary);
                      setEditing(false);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed">
                {research.rawSummary || "No summary available."}
              </p>
            )}
          </div>

          {/* Grid of extracted fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {research.industry && (
              <ResearchField
                icon={<Building2 className="w-3.5 h-3.5" />}
                label="Industry"
                value={research.industry}
              />
            )}
            {research.targetAudience && (
              <ResearchField
                icon={<Users className="w-3.5 h-3.5" />}
                label="Target Audience"
                value={research.targetAudience}
              />
            )}
            {research.valueProposition && (
              <ResearchField
                icon={<Megaphone className="w-3.5 h-3.5" />}
                label="Value Proposition"
                value={research.valueProposition}
                colSpan
              />
            )}
            {research.keyMessaging && (
              <ResearchField
                icon={<Megaphone className="w-3.5 h-3.5" />}
                label="Key Messaging"
                value={research.keyMessaging}
                colSpan
              />
            )}
            {research.contactInfo && (
              <ResearchField
                icon={<Globe className="w-3.5 h-3.5" />}
                label="Contact Info"
                value={research.contactInfo}
              />
            )}
          </div>

          {/* Lists */}
          <div className="space-y-3">
            <ResearchList
              icon={<Layers className="w-3.5 h-3.5" />}
              label="Services / Products"
              items={research.servicesProducts}
            />
            <ResearchList
              icon={<MousePointerClick className="w-3.5 h-3.5" />}
              label="Calls to Action"
              items={research.callsToAction}
            />
            <ResearchList
              icon={<LayoutDashboard className="w-3.5 h-3.5" />}
              label="Existing Website Features"
              items={research.existingWebsiteFeatures}
            />
            <ResearchList
              icon={<Lightbulb className="w-3.5 h-3.5" />}
              label="Potential Opportunities"
              items={research.potentialOpportunities}
              accent="amber"
            />
            <ResearchList
              icon={<HelpCircle className="w-3.5 h-3.5" />}
              label="Needs Confirmation"
              items={research.needsConfirmation}
              accent="slate"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isRegenerating ? (
                <Spinner size="sm" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {isRegenerating ? "Regenerating…" : "Regenerate Research"}
            </button>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Summary
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResearchField({
  icon,
  label,
  value,
  colSpan = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colSpan?: boolean;
}) {
  return (
    <div className={clsx("bg-slate-50 rounded-lg p-3", colSpan && "sm:col-span-2")}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
        {icon}
        {label}
      </p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}

function ResearchList({
  icon,
  label,
  items,
  accent = "default",
}: {
  icon: React.ReactNode;
  label: string;
  items?: string[];
  accent?: "default" | "amber" | "slate";
}) {
  if (!items?.length) return null;

  const dotColor = {
    default: "bg-emerald-400",
    amber: "bg-amber-400",
    slate: "bg-slate-300",
  }[accent];

  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1.5">
        {icon}
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className={clsx("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
