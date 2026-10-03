"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Trash2, FileText, CheckCircle2, Clock, Calendar, PenLine } from "lucide-react";
import { getBriefHistory, deleteBrief, formatDate } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import DeleteModal from "@/components/DeleteModal";
import type { BriefRecord } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function todayLabel() {
  return new Date()
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();
}

const PAGE_SIZE = 5;

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, bg, textColor = "var(--text-primary)" }: {
  icon: React.ReactNode; label: string; value: number | string;
  sub: string; bg: string; textColor?: string;
}) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 border border-border" style={{ backgroundColor: bg }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textColor, opacity: 0.55 }}>
          {label}
        </p>
        <span style={{ color: textColor, opacity: 0.35 }}>{icon}</span>
      </div>
      <div>
        <p className="text-4xl font-extrabold leading-none"
          style={{ color: textColor, fontFamily: "var(--font-bricolage), sans-serif" }}>
          {value}
        </p>
        <p className="text-xs mt-2 leading-snug" style={{ color: textColor, opacity: 0.55 }}>{sub}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [history, setHistory]         = useState<BriefRecord[]>([]);
  const [mounted, setMounted]         = useState(false);
  const [userId, setUserId]           = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BriefRecord | null>(null);
  const [page, setPage]               = useState(1);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    setUserId(user.id);
    getBriefHistory(user.id).then((records) => {
      setHistory(records);
      setMounted(true);
    });
  }, []);

  function confirmDelete(record: BriefRecord, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(record);
  }

  async function executeDelete() {
    if (!deleteTarget || !userId) return;
    await deleteBrief(userId, deleteTarget.id);
    const refreshed = await getBriefHistory(userId);
    setHistory(refreshed);
    const maxPage = Math.max(1, Math.ceil(refreshed.length / PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
    setDeleteTarget(null);
  }

  const readyBriefs = history.filter((r) => r.status === "ready");
  const draftBriefs = history.filter((r) => r.status === "draft");
  const oneWeekAgo  = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekCount   = history.filter((r) => new Date(r.createdAt).getTime() > oneWeekAgo).length;

  // Coming Up: 3 most recent ready briefs only
  const upcoming = readyBriefs.slice(0, 3);

  // Pagination
  const totalPages  = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const paginated   = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          companyName={deleteTarget.input.companyName}
          onConfirm={executeDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="min-h-full sm:px-10 mx-auto max-w-6xl px-5 py-8 md:py-12">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8 anim-fade-up">
          <div>
            <p className="label-eyebrow mb-3">{mounted ? todayLabel() : "\u00A0"}</p>
            <h1 className="heading-hero">
              Make the next call<br />
              <span className="accent">count.</span>
            </h1>
            <p className="mt-4 text-sm max-w-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Your <span style={{ color: "var(--teal)" }}>client context</span>, cleaned{" "}
              <span style={{ color: "var(--orange)" }}>up</span> and ready to use.
              A calmer way into every conversation.
            </p>
          </div>

          <Link
            href="/dashboard/create"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 anim-fade-up-1"
            style={{ backgroundColor: "var(--teal-dark)", color: "var(--text-cream)" }}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: "var(--orange)" }}>+</span>
            Start a new brief
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-8 anim-fade-up-2">
          <StatCard
            icon={<FileText className="w-4 h-4" />}
            label="Total Briefs"
            value={mounted ? history.length : "–"}
            sub="All briefs in your workspace"
            bg="var(--teal-dark)" textColor="var(--text-cream)"
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Ready to Use"
            value={mounted ? readyBriefs.length : "–"}
            sub="AI prep generated and ready"
            bg="var(--orange)" textColor="var(--teal-dark)"
          />
          <StatCard
            icon={<PenLine className="w-4 h-4" />}
            label="Drafts"
            value={mounted ? draftBriefs.length : "–"}
            sub="Saved without AI generation"
            bg="#a9d6c7" textColor="var(--teal-dark)"
          />
          <StatCard
            icon={<Calendar className="w-4 h-4" />}
            label="This Week"
            value={mounted ? weekCount : "–"}
            sub="Briefs created in the last 7 days"
            bg="var(--bg-card)" textColor="var(--text-primary)"
          />
        </div>

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 anim-fade-up-3">

          {/* Briefs list — 2 cols */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--orange)" }} />
                <p className="label-eyebrow" style={{ color: "var(--text-secondary)" }}>Saved Workspace</p>
              </div>
              {mounted && history.length > 0 && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {history.length} brief{history.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <h2 className="text-xl font-extrabold mb-4"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage), sans-serif" }}>
              Your briefs
            </h2>

            {/* Loading skeleton */}
            {!mounted ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-card)" }} />
                ))}
              </div>

            /* Empty state */
            ) : history.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed p-12 text-center"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  No client briefs yet.
                </p>
                <p className="text-xs mb-4">Create your first brief to get started.</p>
                <Link href="/dashboard/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
                  Create your first brief →
                </Link>
              </div>

            /* Brief rows */
            ) : (
              <>
                <div className="space-y-2">
                  {paginated.map((record) => (
                    <Link
                      key={record.id}
                      href={`/dashboard/brief/${record.id}`}
                      className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 border border-light-100 hover:border-primary/50 hover:shadow"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        display: "flex",
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: record.status === "draft" ? "#D8D2C8" : "#7CBFB5", color: "var(--teal-dark)" }}
                      >
                        {getInitials(record.input.companyName)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                            {record.input.companyName}
                          </p>
                          {record.status === "draft" ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: "#FEF9C3", color: "#854D0E" }}>
                              Draft
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: "#E8F5E4", color: "#2D7A3A" }}>
                              Ready
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                          {record.input.service.split("(")[0].trim()}
                          {record.input.notes ? ` · ${record.input.notes.split(" ").slice(0, 5).join(" ")}…` : ""}
                          {" · "}{formatDate(record.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <ArrowRight className="w-4 h-4 opacity-20 group-hover:opacity-60 transition-opacity"
                          style={{ color: "var(--text-secondary)" }} />
                        <button
                          onClick={(e) => confirmDelete(record, e)}
                          aria-label={`Delete ${record.input.companyName}`}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                    >
                      ← Previous
                    </button>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Page {page} of {totalPages}
                    </p>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Coming Up panel — fixed height, internal scroll ──────────── */}
          <div
            className="rounded-2xl p-5 flex flex-col relative overflow-hidden"
            style={{ backgroundColor: "var(--teal-dark)", height: "fit-content", maxHeight: "420px" }}
          >
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[18px]" style={{ borderColor: "var(--orange)" }}></div>
            <div className="absolute right-10 top-16 h-3 w-3 rounded-full" style={{ backgroundColor: "var(--teal-light)" }}></div>
            <div className="flex items-center gap-1.5 mb-4 shrink-0">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--orange)" }} />
              <p className="label-eyebrow" style={{ color: "rgba(255,255,255,0.45)" }}>Coming Up</p>
            </div>
            <h3
              className="text-2xl font-extrabold leading-tight mb-5 shrink-0"
              style={{ color: "var(--text-cream)", fontFamily: "var(--font-bricolage), sans-serif" }}
            >
              The next room<br />is yours.
            </h3>

            {!mounted || upcoming.length === 0 ? (
              <p className="text-sm opacity-40" style={{ color: "var(--text-cream)" }}>
                No upcoming calls yet.
              </p>
            ) : (
              <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "200px" }}>
                {upcoming.map((record) => (
                  <Link
                    key={record.id}
                    href={`/dashboard/brief/${record.id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:opacity-80"
                    style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: "var(--orange)", color: "#fff" }}
                    >
                      {getInitials(record.input.companyName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-cream)" }}>
                        {record.input.companyName}
                      </p>
                      <p className="text-[10px] opacity-50 truncate" style={{ color: "var(--text-cream)" }}>
                        {record.input.service.split("(")[0].trim()} · {formatDate(record.createdAt)}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-30 shrink-0" style={{ color: "var(--text-cream)" }} />
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/dashboard/create"
              className="mt-4 shrink-0 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--orange)", color: "#fff" }}
            >
              + New brief
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
