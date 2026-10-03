"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Calendar, Clock, User, Mail, Phone,
  MessageSquare, CheckCircle2, ExternalLink, AlertCircle,
  AlarmClock, Trash2, CalendarDays, Plus,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getAppointments, saveAppointment, deleteAppointment,
  formatApptDate, type SavedAppointment,
} from "@/lib/storage";
import Spinner from "@/components/Spinner";

// ── Options ───────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00","18:30",
];
const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
];
const TOPICS = [
  "Discovery call","Project kickoff","Design review","Progress update",
  "Proposal presentation","Handoff & walkthrough","Support / bug discussion","Other",
];

// ── Shared input styles ───────────────────────────────────────────────────────

const inputClass = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#EE8953]/40";
const inputStyle = {
  backgroundColor: "var(--bg-card-alt)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-dm-sans), sans-serif",
};

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, required, hint, icon, children }: {
  label: string; required?: boolean; hint?: string;
  icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-1.5">
        <span className="flex items-center gap-1.5 text-sm font-semibold mb-0.5"
          style={{ color: "var(--text-primary)" }}>
          {icon && <span style={{ color: "var(--text-muted)" }}>{icon}</span>}
          {label}
          {required && <span style={{ color: "var(--orange)" }}> *</span>}
        </span>
        {hint && <span className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{hint}</span>}
        {children}
      </label>
    </div>
  );
}

// ── Appointment card ──────────────────────────────────────────────────────────

function ApptCard({ appt, onDelete }: { appt: SavedAppointment; onDelete: () => void }) {
  const isPast = new Date(`${appt.date}T${appt.time}`) < new Date();
  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3 transition-all hover:shadow-sm group"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        opacity: isPast ? 0.65 : 1,
      }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: isPast ? "var(--border)" : "var(--orange)", color: "#fff" }}>
        <CalendarDays className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            {appt.clientName}
          </p>
          {isPast && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "var(--border-light)", color: "var(--text-muted)" }}>
              Past
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {appt.topic} · {appt.duration} min
        </p>
        <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--teal)" }}>
          {formatApptDate(appt.date, appt.time)}
        </p>
        {appt.clientEmail && (
          <p className="text-xs mt-0.5 opacity-60" style={{ color: "var(--text-muted)" }}>
            {appt.clientEmail}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a href={appt.calendarUrl} target="_blank" rel="noopener noreferrer"
          title="Open in Google Calendar"
          className="p-1.5 rounded-lg opacity-40 hover:opacity-80 transition-opacity"
          style={{ color: "#1967D2" }}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={onDelete} title="Delete appointment"
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity"
          style={{ color: "#DC2626" }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Schedule form (inner — needs useSearchParams) ─────────────────────────────

function ScheduleForm({ userId, onBooked }: { userId: string; onBooked: () => void }) {
  const searchParams = useSearchParams();
  const prefillCompany = searchParams.get("company") ?? "";
  const prefillBriefId = searchParams.get("briefId") ?? "";
  const user = getCurrentUser();

  const [clientName,  setClientName]  = useState(prefillCompany);
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [date,        setDate]        = useState("");
  const [time,        setTime]        = useState("10:00");
  const [duration,    setDuration]    = useState(60);
  const [topic,       setTopic]       = useState("Discovery call");
  const [customTopic, setCustomTopic] = useState("");
  const [notes,       setNotes]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [done,        setDone]        = useState(false);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) { setError("Client name is required."); return; }
    if (!clientEmail.trim()) { setError("Client email is required."); return; }
    if (!date) { setError("Please select a date."); return; }
    if (!time) { setError("Please select a time."); return; }

    setLoading(true); setError(null);
    const effectiveTopic = topic === "Other" ? (customTopic.trim() || "Call") : topic;

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(), clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim() || undefined, date, time, duration,
          topic: effectiveTopic, notes: notes.trim() || undefined,
          ownerName: user?.name ?? "Freelancer", ownerEmail: user?.email ?? "",
          briefId: prefillBriefId || undefined, companyName: prefillCompany || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? "Could not create appointment."); setLoading(false); return; }

      // Persist to localStorage
      saveAppointment(userId, {
        clientName: clientName.trim(), clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim() || undefined, date, time, duration,
        topic: effectiveTopic, notes: notes.trim() || undefined,
        calendarUrl: data.calendarUrl, briefId: prefillBriefId || undefined,
      });

      // Open calendar immediately
      window.open(data.calendarUrl, "_blank", "noopener,noreferrer");
      setDone(true);
      onBooked();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }

  if (done) {
    return (
      <div className="rounded-2xl p-7 text-center anim-scale-in"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#E8F5E4" }}>
          <CheckCircle2 className="w-6 h-6" style={{ color: "#2D7A3A" }} />
        </div>
        <h3 className="text-lg font-extrabold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage), sans-serif" }}>
          Appointment saved!
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Google Calendar opened in a new tab. The appointment is saved in your list below.
        </p>
        <button onClick={() => { setDone(false); setClientEmail(""); setNotes(""); setDate(""); setClientName(""); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
          <Plus className="w-4 h-4" /> Schedule another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Client */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <p className="label-eyebrow" style={{ color: "var(--text-muted)" }}>Client details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Client / company name" required icon={<User className="w-4 h-4" />}>
            <input type="text" value={clientName}
              onChange={(e) => { setClientName(e.target.value); setError(null); }}
              placeholder="e.g. Northstar Ceramics" autoFocus disabled={loading}
              className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Client email" required icon={<Mail className="w-4 h-4" />}>
            <input type="email" value={clientEmail}
              onChange={(e) => { setClientEmail(e.target.value); setError(null); }}
              placeholder="client@example.com" disabled={loading}
              className={inputClass} style={inputStyle} />
          </Field>
        </div>
        <Field label="Client phone" hint="Optional — for WhatsApp reminders." icon={<Phone className="w-4 h-4" />}>
          <input type="tel" value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+44 7911 123456" disabled={loading}
            className={inputClass} style={inputStyle} />
        </Field>
      </div>

      {/* Date & time */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <p className="label-eyebrow" style={{ color: "var(--text-muted)" }}>Date & time</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Date" required icon={<Calendar className="w-4 h-4" />}>
            <input type="date" value={date} min={today}
              onChange={(e) => { setDate(e.target.value); setError(null); }}
              disabled={loading} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Start time" required icon={<Clock className="w-4 h-4" />}>
            <select value={time} onChange={(e) => setTime(e.target.value)}
              disabled={loading} className={inputClass} style={inputStyle}>
              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Duration" required icon={<AlarmClock className="w-4 h-4" />}>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
              disabled={loading} className={inputClass} style={inputStyle}>
              {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Meeting details */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <p className="label-eyebrow" style={{ color: "var(--text-muted)" }}>Meeting details</p>
        <Field label="Topic / purpose" required icon={<MessageSquare className="w-4 h-4" />}>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}
            disabled={loading} className={inputClass} style={inputStyle}>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        {topic === "Other" && (
          <Field label="Custom topic" required>
            <input type="text" value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Describe the meeting purpose" disabled={loading}
              className={inputClass} style={inputStyle} />
          </Field>
        )}
        <Field label="Additional notes" hint="Context to include in the calendar invite.">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Agenda items, links, or prep notes…"
            rows={3} disabled={loading}
            className={`${inputClass} resize-y min-h-[80px]`} style={inputStyle} />
        </Field>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FDECEA", color: "#B91C1C" }}>
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
        </div>
      )}

      <div className="flex items-center justify-end pt-1">
        <button type="submit" disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--teal-dark)", color: "var(--text-cream)" }}>
          {loading ? <><Spinner size="sm" light />Scheduling…</> : <><Calendar className="w-4 h-4" />Schedule appointment</>}
        </button>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [userId, setUserId]           = useState<string | null>(null);
  const [appointments, setAppointments] = useState<SavedAppointment[]>([]);
  const [mounted, setMounted]         = useState(false);
  const [activeTab, setActiveTab]     = useState<"new" | "list">("new");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    setUserId(user.id);
    setAppointments(getAppointments(user.id));
    setMounted(true);
  }, []);

  function handleBooked() {
    if (!userId) return;
    setAppointments(getAppointments(userId));
    setActiveTab("list");
  }

  function handleDelete(id: string) {
    if (!userId) return;
    deleteAppointment(userId, id);
    setAppointments(getAppointments(userId));
  }

  const upcoming = appointments.filter((a) => new Date(`${a.date}T${a.time}`) >= new Date());
  const past     = appointments.filter((a) => new Date(`${a.date}T${a.time}`) <  new Date());

  return (
    <div className="min-h-full px-4 sm:px-10 py-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm mb-7 opacity-50 hover:opacity-100 transition-opacity anim-fade-in"
        style={{ color: "var(--text-secondary)" }}>
        <ChevronLeft className="w-4 h-4" /> Back to overview
      </Link>

      {/* Heading */}
      <div className="mb-7 anim-fade-up">
        <p className="label-eyebrow mb-3">Book a call</p>
        <h1 style={{
          fontFamily: "var(--font-bricolage), sans-serif",
          fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
          fontWeight: 800, lineHeight: 1.1, color: "var(--text-primary)",
        }}>
          Schedule an<br /><span style={{ color: "var(--orange)" }}>appointment.</span>
        </h1>
        <p className="mt-3 text-sm max-w-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Set up a client meeting and save it to Google Calendar in one click.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        {([
          { key: "new",  label: "New appointment" },
          { key: "list", label: `My appointments${mounted && appointments.length ? ` (${appointments.length})` : ""}` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === key ? "var(--teal-dark)" : "transparent",
              color: activeTab === key ? "var(--text-cream)" : "var(--text-muted)",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* New appointment form */}
      {activeTab === "new" && (
        <div className="anim-fade-up-1">
          {userId ? (
            <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
              <ScheduleForm userId={userId} onBooked={handleBooked} />
            </Suspense>
          ) : (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          )}
        </div>
      )}

      {/* My appointments list */}
      {activeTab === "list" && (
        <div className="anim-fade-up-1 space-y-6">
          {!mounted ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : appointments.length === 0 ? (
            <div className="rounded-2xl p-12 text-center"
              style={{ backgroundColor: "var(--bg-card)", border: "2px dashed var(--border)" }}>
              <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "var(--text-secondary)" }} />
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No appointments yet.</p>
              <button onClick={() => setActiveTab("new")}
                className="mt-3 text-sm font-semibold hover:underline" style={{ color: "var(--orange)" }}>
                Schedule your first one →
              </button>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div>
                  <p className="label-eyebrow mb-3" style={{ color: "var(--text-secondary)" }}>
                    Upcoming ({upcoming.length})
                  </p>
                  <div className="space-y-2">
                    {upcoming.map((a) => (
                      <ApptCard key={a.id} appt={a} onDelete={() => handleDelete(a.id)} />
                    ))}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <p className="label-eyebrow mb-3" style={{ color: "var(--text-muted)" }}>
                    Past ({past.length})
                  </p>
                  <div className="space-y-2">
                    {past.map((a) => (
                      <ApptCard key={a.id} appt={a} onDelete={() => handleDelete(a.id)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
