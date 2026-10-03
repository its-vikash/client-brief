// ── Appointment scheduling ────────────────────────────────────────────────────
//
// Stores appointment bookings in the user's localStorage-scoped data via the
// client, and generates a Google Calendar link for confirmation.
//
// No external booking service required — this is a self-hosted lightweight
// scheduler. To upgrade: replace with Calendly API, Cal.com API, or
// Google Calendar OAuth v2.

import { NextRequest, NextResponse } from "next/server";

export interface AppointmentRequest {
  // Booker (the client / prospect)
  clientName:  string;
  clientEmail: string;
  clientPhone?: string;

  // Appointment details
  date:     string;  // ISO date string  e.g. "2026-10-15"
  time:     string;  // 24h e.g. "14:00"
  duration: number;  // minutes: 30 | 45 | 60
  topic:    string;  // free text
  notes?:   string;

  // Owner's details (the freelancer)
  ownerName:  string;
  ownerEmail: string;

  // Optional: brief to attach
  briefId?:      string;
  companyName?:  string;
}

export interface AppointmentResponse {
  calendarUrl:  string;
  confirmationMessage: string;
  appointmentId: string;
}

export interface AppointmentError {
  error: string;
}

function toGCalDate(date: string, time: string): string {
  // YYYYMMDDTHHMMSS (local, no Z — so Calendar uses the user's timezone)
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString().replace(/[-:]/g, "").slice(0, 15);
}

function addMinutes(date: string, time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m + mins, 0, 0);
  return d.toISOString().replace(/[-:]/g, "").slice(0, 15);
}

function formatReadable(date: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m);
  return d.toLocaleString("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
    year:    "numeric",
    hour:    "numeric",
    minute:  "2-digit",
  });
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<AppointmentResponse | AppointmentError>> {
  let body: AppointmentRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Validate required fields
  if (!body.clientName?.trim())
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  if (!body.clientEmail?.trim())
    return NextResponse.json({ error: "Client email is required." }, { status: 400 });
  if (!body.date)
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  if (!body.time)
    return NextResponse.json({ error: "Time is required." }, { status: 400 });
  if (!body.topic?.trim())
    return NextResponse.json({ error: "Topic / purpose is required." }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const duration = body.duration ?? 60;

  // Build event title
  const eventTitle = body.companyName
    ? `Call: ${body.ownerName} × ${body.companyName} — ${body.topic}`
    : `Call: ${body.ownerName} × ${body.clientName} — ${body.topic}`;

  // Build description
  const descLines = [
    `Meeting with ${body.clientName} (${body.clientEmail})`,
    body.clientPhone ? `Phone: ${body.clientPhone}` : "",
    "",
    `Topic: ${body.topic}`,
    body.notes ? `Notes: ${body.notes}` : "",
    "",
    body.briefId ? `Brief: ${appUrl}/dashboard/brief/${body.briefId}` : "",
  ].filter((l) => l !== undefined);

  const description = descLines.join("\n").trim();

  const start = toGCalDate(body.date, body.time);
  const end   = addMinutes(body.date, body.time, duration);

  const params = new URLSearchParams({
    text:    eventTitle,
    dates:   `${start}/${end}`,
    details: description,
    sf:      "true",
    output:  "xml",
  });

  const calendarUrl = `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;

  const readable = formatReadable(body.date, body.time);

  const confirmationMessage = [
    `✅ Appointment confirmed with ${body.clientName}.`,
    `📅 ${readable} (${duration} minutes)`,
    `📋 Topic: ${body.topic}`,
    "",
    "Click the calendar link to save it to your calendar.",
  ].join("\n");

  const appointmentId = crypto.randomUUID();

  return NextResponse.json(
    { calendarUrl, confirmationMessage, appointmentId },
    { status: 200 }
  );
}
