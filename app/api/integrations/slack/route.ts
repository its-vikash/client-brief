// ── Slack Integration ─────────────────────────────────────────────────────────
//
// TO ACTIVATE THIS INTEGRATION:
//
// 1. Create a Slack App at https://api.slack.com/apps
//    → Add "Incoming Webhooks" and "chat:write" bot scope
//    → Install to your workspace
//    → Copy the Bot User OAuth Token
//
// 2. Add to .env.local:
//    SLACK_BOT_TOKEN=xoxb-your-bot-token-here
//    SLACK_DEFAULT_CHANNEL=#preconvara-summaries
//
// 3. This route will then send AI-generated brief summaries to your Slack channel.

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL_CHAIN = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return _ai;
}

export interface SlackSendRequest {
  briefTitle:    string;
  briefSummary:  string;
  companyName:   string;
  service:       string;
  keyPoints:     string[];
  actionItems:   string[];
  channel?:      string;  // override default channel
  briefUrl?:     string;
}

export interface SlackSendResponse {
  ok:      boolean;
  message: string;
  channel: string;
}

export interface SlackSendError { error: string; setup?: boolean; }

async function generateSlackMessage(req: SlackSendRequest): Promise<string> {
  const prompt = `Create a concise Slack message (not more than 300 words) summarising this client brief.
Use Slack markdown (*bold*, _italic_, • bullets).

Brief: ${req.briefTitle}
Company: ${req.companyName}
Service: ${req.service}
Summary: ${req.briefSummary}
Key Points: ${req.keyPoints.slice(0, 5).join(", ")}
Actions: ${req.actionItems.slice(0, 3).join(", ")}

Format: Heading, 3-4 bullet summary, 2-3 action items, link placeholder [View full brief →]`;

  for (const model of MODEL_CHAIN) {
    try {
      const ai = getAI();
      const result = await ai.models.generateContent({ model, contents: prompt, config: { maxOutputTokens: 400, temperature: 0.4 } });
      const text = result.text?.trim();
      if (text) return text.replace("[View full brief →]", req.briefUrl ? `<${req.briefUrl}|View full brief →>` : "View full brief in PreConvara");
    } catch { continue; }
  }
  return `*New brief ready: ${req.companyName}*\n${req.briefSummary}\n${req.briefUrl ? `<${req.briefUrl}|View full brief →>` : ""}`;
}

async function sendToSlack(text: string, channel: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ channel, text, unfurl_links: false }),
  });
  const data = await res.json();
  return { ok: data.ok === true, error: data.error };
}

export async function POST(req: NextRequest): Promise<NextResponse<SlackSendResponse | SlackSendError>> {
  // Check configuration
  const token   = process.env.SLACK_BOT_TOKEN;
  const defChan = process.env.SLACK_DEFAULT_CHANNEL ?? "#preconvara-summaries";

  if (!token) {
    return NextResponse.json({
      error: "Slack is not configured. Add SLACK_BOT_TOKEN to your .env.local file.",
      setup: true,
    }, { status: 503 });
  }

  if (!process.env.GEMINI_API_KEY)
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });

  let body: SlackSendRequest;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.briefTitle?.trim())
    return NextResponse.json({ error: "Brief title is required." }, { status: 400 });

  const channel = body.channel ?? defChan;
  const message = await generateSlackMessage(body);
  const result  = await sendToSlack(message, channel, token);

  if (!result.ok) {
    return NextResponse.json({
      error: `Slack returned an error: ${result.error ?? "unknown"}. Check your bot token and channel name.`,
    }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Sent to Slack successfully.", channel }, { status: 200 });
}
