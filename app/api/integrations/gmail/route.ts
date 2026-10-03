// ── Gmail Integration — Pull email threads ────────────────────────────────────
//
// TO ACTIVATE THIS INTEGRATION:
//
// 1. Create a Google Cloud project at console.cloud.google.com
//    → Enable the Gmail API
//    → Create OAuth2 credentials (Web application)
//    → Add authorised redirect URI: http://localhost:3000/api/integrations/gmail/callback
//
// 2. Add to .env.local:
//    GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
//    GOOGLE_CLIENT_SECRET=your-client-secret
//    GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/gmail/callback
//
// 3. The OAuth flow:
//    a) User clicks "Connect Gmail" → GET /api/integrations/gmail → redirects to Google consent
//    b) Google redirects back → GET /api/integrations/gmail/callback → exchanges code for tokens
//    c) Tokens stored in session → subsequent calls use access token to fetch emails
//
// This stub implements the thread-fetching logic so it's ready once OAuth is wired up.

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL_CHAIN = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return _ai;
}

// ── Check if OAuth is configured ──────────────────────────────────────────────
function isGmailConfigured() {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    !process.env.GOOGLE_CLIENT_ID.includes("your-client-id")
  );
}

// ── Fetch threads from Gmail API ─────────────────────────────────────────────
async function fetchEmailThreads(accessToken: string, query: string, maxResults = 5) {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  if (!listData.threads?.length) return [];

  const threads = await Promise.all(
    listData.threads.map(async (t: { id: string }) => {
      const threadRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return threadRes.json();
    })
  );
  return threads;
}

// ── Extract readable text from Gmail message parts ───────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractEmailText(thread: any): string {
  const messages: any[] = thread.messages ?? [];
  return messages.slice(0, 5).map((msg: any) => {
    const parts = msg.payload?.parts ?? [];
    const textPart = parts.find((p: any) => p.mimeType === "text/plain");
    const raw = textPart?.body?.data ?? msg.payload?.body?.data ?? "";
    try { return Buffer.from(raw, "base64").toString("utf-8").slice(0, 1000); } catch { return ""; }
  }).filter(Boolean).join("\n\n---\n\n");
}

// ── AI summarise email thread ─────────────────────────────────────────────────
async function summariseThread(emailText: string, companyName: string): Promise<string> {
  const prompt = `Summarise this email thread between a freelancer and their client "${companyName}". Extract: key topics discussed, any decisions made, outstanding requests, and tone of the conversation. Be concise — 3-5 sentences max.

Email thread:
${emailText.slice(0, 4000)}`;

  for (const model of MODEL_CHAIN) {
    try {
      const ai = getAI();
      const result = await ai.models.generateContent({ model, contents: prompt, config: { maxOutputTokens: 400, temperature: 0.3 } });
      const text = result.text?.trim();
      if (text) return text;
    } catch { continue; }
  }
  return "Could not summarise thread.";
}

// ── Route ─────────────────────────────────────────────────────────────────────
export interface GmailRequest {
  accessToken:  string;   // OAuth2 access token (passed from client after OAuth flow)
  companyName:  string;   // search query — emails related to this company
  maxResults?:  number;
}

export interface GmailResponse {
  threads: {
    id:      string;
    subject: string;
    snippet: string;
    summary: string;
    date:    string;
  }[];
}

export interface GmailError { error: string; setup?: boolean; }

export async function GET(): Promise<NextResponse> {
  if (!isGmailConfigured()) {
    return NextResponse.json({ error: "Gmail OAuth is not configured.", setup: true }, { status: 503 });
  }
  // Redirect to Google OAuth consent screen
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope:         "https://www.googleapis.com/auth/gmail.readonly",
    access_type:   "offline",
    prompt:        "consent",
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

export async function POST(req: NextRequest): Promise<NextResponse<GmailResponse | GmailError>> {
  if (!isGmailConfigured()) {
    return NextResponse.json({ error: "Gmail OAuth is not configured. See the setup guide.", setup: true }, { status: 503 });
  }
  if (!process.env.GEMINI_API_KEY)
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });

  let body: GmailRequest;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.companyName?.trim())
    return NextResponse.json({ error: "Company name is required to search emails." }, { status: 400 });

  // Read access token from the HTTP-only cookie (set by the OAuth callback)
  const tokenCookie = req.cookies.get("gmail_token")?.value;
  let accessToken: string | null = null;

  if (tokenCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(tokenCookie));
      if (parsed.access_token && parsed.expires_at > Date.now()) {
        accessToken = parsed.access_token;
      }
    } catch { /* invalid cookie */ }
  }

  // Also accept token passed directly in the body for backward compatibility
  if (!accessToken && body.accessToken && body.accessToken !== "from_cookie" && body.accessToken !== "check") {
    accessToken = body.accessToken;
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "Gmail session expired or not connected. Please reconnect your Gmail account." },
      { status: 401 }
    );
  }

  try {
    const rawThreads = await fetchEmailThreads(accessToken, body.companyName, body.maxResults ?? 5);
    const threads = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawThreads.map(async (thread: any) => {
        const headers   = thread.messages?.[0]?.payload?.headers ?? [];
        const subject   = (headers as { name: string; value: string }[]).find((h) => h.name.toLowerCase() === "subject")?.value ?? "No subject";
        const date      = (headers as { name: string; value: string }[]).find((h) => h.name.toLowerCase() === "date")?.value ?? "";
        const emailText = extractEmailText(thread);
        const summary   = emailText ? await summariseThread(emailText, body.companyName) : "No readable content.";
        return { id: thread.id, subject, snippet: emailText.slice(0, 100), summary, date };
      })
    );
    return NextResponse.json({ threads }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("401")) return NextResponse.json({ error: "Gmail access expired. Please reconnect." }, { status: 401 });
    return NextResponse.json({ error: "Failed to fetch emails. Please try again." }, { status: 500 });
  }
}
