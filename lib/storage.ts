// ── Storage layer — Supabase when configured, localStorage fallback otherwise ─
//
// All functions are async so the calling code is identical regardless of
// which backend is active.  The BriefRecord shape is identical in both paths.

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { BriefRecord, BriefFormData, ClientBrief, WebsiteResearch } from "@/types";

// ── localStorage key helpers ──────────────────────────────────────────────────

const MAX_LS_RECORDS = 50;

function lsKey(userId: string): string {
  return `cb_briefs_${userId}`;
}

// ── localStorage helpers ──────────────────────────────────────────────────────

function lsGetAll(userId: string): BriefRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(lsKey(userId));
    if (!raw) return [];
    const records = JSON.parse(raw) as BriefRecord[];
    return records.map((r) => ({
      ...r,
      userId: r.userId ?? userId,
      status: r.status ?? "ready",
    }));
  } catch { return []; }
}

function lsSave(userId: string, records: BriefRecord[]) {
  localStorage.setItem(lsKey(userId), JSON.stringify(records.slice(0, MAX_LS_RECORDS)));
}

// ── Row → BriefRecord conversion ──────────────────────────────────────────────

function rowToRecord(row: {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  company_name: string;
  website_url: string | null;
  service: string;
  notes: string | null;
  brief_json: ClientBrief | null;
  research_json: WebsiteResearch | null;
}): BriefRecord {
  return {
    id:        row.id,
    userId:    row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status:    (row.status as "ready" | "draft"),
    input: {
      companyName: row.company_name,
      websiteUrl:  row.website_url ?? "",
      service:     row.service,
      notes:       row.notes ?? "",
    },
    brief:           row.brief_json    ?? undefined,
    websiteResearch: row.research_json ?? undefined,
  };
}

// ── READ ──────────────────────────────────────────────────────────────────────

export async function getBriefHistory(userId: string): Promise<BriefRecord[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("briefs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) { console.error("[storage] getBriefHistory:", error.message); return []; }
    return (data ?? []).map(rowToRecord);
  }
  return lsGetAll(userId);
}

export async function getBriefById(id: string, userId: string): Promise<BriefRecord | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("briefs")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)          // RLS already enforces this, belt-and-braces
      .maybeSingle();
    if (error || !data) return null;
    return rowToRecord(data);
  }
  const records = lsGetAll(userId);
  const r = records.find((rec) => rec.id === id && rec.userId === userId);
  return r ?? null;
}

// ── WRITE ─────────────────────────────────────────────────────────────────────

export async function saveBrief(
  userId:          string,
  input:           BriefFormData,
  brief:           ClientBrief,
  websiteResearch?: WebsiteResearch
): Promise<BriefRecord> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("briefs")
      .insert({
        user_id:      userId,
        status:       "ready",
        company_name: input.companyName,
        website_url:  input.websiteUrl || null,
        service:      input.service,
        notes:        input.notes || null,
        brief_json:   brief,
        research_json: websiteResearch ?? null,
      })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to save brief");
    return rowToRecord(data);
  }

  const record: BriefRecord = {
    id:        crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status:    "ready",
    input,
    brief,
    websiteResearch,
  };
  const all = lsGetAll(userId);
  lsSave(userId, [record, ...all]);
  return record;
}

export async function saveDraft(
  userId:           string,
  input:            BriefFormData,
  websiteResearch?: WebsiteResearch
): Promise<BriefRecord> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("briefs")
      .insert({
        user_id:       userId,
        status:        "draft",
        company_name:  input.companyName,
        website_url:   input.websiteUrl || null,
        service:       input.service,
        notes:         input.notes || null,
        brief_json:    null,
        research_json: websiteResearch ?? null,
      })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to save draft");
    return rowToRecord(data);
  }

  const record: BriefRecord = {
    id:        crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status:    "draft",
    input,
    websiteResearch,
  };
  const all = lsGetAll(userId);
  lsSave(userId, [record, ...all]);
  return record;
}

/** Update brief content in-place (Regenerate). Same ID, same URL. */
export async function updateBriefInPlace(
  userId:           string,
  id:               string,
  brief:            ClientBrief,
  websiteResearch?: WebsiteResearch
): Promise<BriefRecord | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("briefs")
      .update({
        brief_json:    brief,
        research_json: websiteResearch ?? null,
        status:        "ready",
        updated_at:    new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error || !data) { console.error("[storage] updateBriefInPlace:", error?.message); return null; }
    return rowToRecord(data);
  }

  const all = lsGetAll(userId);
  const idx = all.findIndex((r) => r.id === id && r.userId === userId);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    brief,
    websiteResearch: websiteResearch ?? all[idx].websiteResearch,
    status:    "ready",
    updatedAt: new Date().toISOString(),
  };
  lsSave(userId, all);
  return all[idx];
}

/**
 * Update an existing record's input/context in-place as a draft.
 * Used when the user clicks "Save as Draft" while editing an existing brief —
 * keeps the same ID so no duplicate is created.
 */
export async function updateDraftInPlace(
  userId:           string,
  id:               string,
  input:            BriefFormData,
  websiteResearch?: WebsiteResearch
): Promise<BriefRecord | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("briefs")
      .update({
        status:        "draft",
        company_name:  input.companyName,
        website_url:   input.websiteUrl || null,
        service:       input.service,
        notes:         input.notes || null,
        brief_json:    null,
        research_json: websiteResearch ?? null,
        updated_at:    new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error || !data) { console.error("[storage] updateDraftInPlace:", error?.message); return null; }
    return rowToRecord(data);
  }

  const all = lsGetAll(userId);
  const idx = all.findIndex((r) => r.id === id && r.userId === userId);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    input,
    brief:           undefined,          // clear any existing AI content
    websiteResearch: websiteResearch ?? all[idx].websiteResearch,
    status:          "draft",
    updatedAt:       new Date().toISOString(),
  };
  lsSave(userId, all);
  return all[idx];
}

export async function deleteBrief(userId: string, id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from("briefs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) console.error("[storage] deleteBrief:", error.message);
    return;
  }
  const all = lsGetAll(userId).filter((r) => !(r.id === id && r.userId === userId));
  lsSave(userId, all);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatDateShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Appointments (localStorage only — upgrade to Supabase table when ready) ──

export interface SavedAppointment {
  id:           string;
  userId:       string;
  clientName:   string;
  clientEmail:  string;
  clientPhone?: string;
  date:         string;   // ISO date  "2026-10-15"
  time:         string;   // "14:00"
  duration:     number;   // minutes
  topic:        string;
  notes?:       string;
  calendarUrl:  string;
  createdAt:    string;   // ISO timestamp
  briefId?:     string;
}

function apptKey(userId: string): string {
  return `cb_appointments_${userId}`;
}

export function getAppointments(userId: string): SavedAppointment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(apptKey(userId));
    return raw ? (JSON.parse(raw) as SavedAppointment[]) : [];
  } catch { return []; }
}

export function saveAppointment(
  userId: string,
  appt:   Omit<SavedAppointment, "id" | "userId" | "createdAt">
): SavedAppointment {
  const record: SavedAppointment = {
    id:        crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
    ...appt,
  };
  const existing = getAppointments(userId);
  localStorage.setItem(apptKey(userId), JSON.stringify([record, ...existing].slice(0, 100)));
  return record;
}

export function deleteAppointment(userId: string, id: string): void {
  const updated = getAppointments(userId).filter((a) => a.id !== id);
  localStorage.setItem(apptKey(userId), JSON.stringify(updated));
}

export function formatApptDate(date: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m);
  return d.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });
}
