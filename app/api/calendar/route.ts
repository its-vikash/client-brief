// ── Google Calendar — Add follow-up event ────────────────────────────────────
//
// This route generates a Google Calendar "Add Event" link using the RFC-5545
// data URI format. No OAuth is required — the user opens the link in their
// browser and Google Calendar pre-fills the event for one-click saving.
//
// To upgrade to full OAuth (auto-create events without user click):
//   1. Create a Google Cloud project
//   2. Enable the Calendar API
//   3. Add GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to .env.local
//   4. Implement the oauth2 flow using @googleapis/calendar

import { NextRequest, NextResponse } from "next/server";

interface CalendarRequest {
  companyName:  string;
  service:      string;
  notes?:       string;
  briefId:      string;
  /** ISO date string for the event (defaults to 7 days from now) */
  eventDate?:   string;
}

interface CalendarResponse {
  url: string;
  eventTitle: string;
}

interface CalendarError {
  error: string;
}

function toCalendarDate(iso: string): string {
  // Google Calendar uses YYYYMMDD for all-day events
  return iso.slice(0, 10).replace(/-/g, "");
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<CalendarResponse | CalendarError>> {
  let body: CalendarRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.companyName?.trim()) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }

  // Default follow-up: 7 days from now
  const eventDate = body.eventDate
    ? new Date(body.eventDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const startDate = toCalendarDate(eventDate.toISOString());
  // All-day event — end date is the next day in Google Calendar
  const endDate = toCalendarDate(
    new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
  );

  const serviceShort = body.service.split("(")[0].trim();
  const eventTitle   = `Follow-up: ${body.companyName} — ${serviceShort}`;

  const description = [
    `Follow-up call with ${body.companyName}.`,
    `Service: ${serviceShort}`,
    body.notes ? `\nContext: ${body.notes.slice(0, 300)}` : "",
    `\nBrief: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/brief/${body.briefId}`,
  ]
    .filter(Boolean)
    .join("\n");

  // Build Google Calendar URL
  // https://calendar.google.com/calendar/r/eventedit?text=...&dates=...&details=...
  const params = new URLSearchParams({
    text:    eventTitle,
    dates:   `${startDate}/${endDate}`,
    details: description,
    sf:      "true",
    output:  "xml",
  });

  const url = `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;

  return NextResponse.json({ url, eventTitle }, { status: 200 });
}
