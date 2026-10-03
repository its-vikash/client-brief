import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL_CHAIN = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];

let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return _ai;
}

const SYSTEM_PROMPT = `You are an expert meeting analyst and document summariser.
Analyse the provided transcript or document and produce a structured summary.

CRITICAL RULES:
1. Only report what is ACTUALLY in the text. Never invent information.
2. Label speakers if identifiable. Use "Speaker 1 / Speaker 2" if unnamed.
3. Be concise — busy professionals will read this in 2 minutes.
4. Capture every decision and action item — these are the most important parts.

Respond with ONLY a valid JSON object (no markdown fences):

{
  "title": "string — descriptive title for this meeting/document",
  "type": "string — e.g. Client Meeting, Team Standup, Interview, Sales Call, Document",
  "date": "string — date mentioned or null",
  "participants": ["string"],
  "executiveSummary": "string — 2-3 sentence overview of what happened and why it matters",
  "keyPoints": ["string — 5-8 most important points discussed"],
  "decisions": ["string — every decision made, with owner if mentioned"],
  "actionItems": [
    { "task": "string", "owner": "string or null", "dueDate": "string or null" }
  ],
  "openQuestions": ["string — unresolved items needing follow-up"],
  "sentiment": "string — Positive / Mixed / Neutral / Tense",
  "nextSteps": "string — recommended next action paragraph"
}`;

export interface SummarizeRequest {
  text: string;
  filename?: string;
}

export interface SummarizeResponse {
  title: string;
  type: string;
  date: string | null;
  participants: string[];
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: { task: string; owner: string | null; dueDate: string | null }[];
  openQuestions: string[];
  sentiment: string;
  nextSteps: string;
}

export interface SummarizeError { error: string; }

function extractJSON(raw: string): string | null {
  const t = raw.trim();
  if (t.startsWith("{")) return t;
  const s = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  if (s.startsWith("{")) return s;
  const m = s.match(/\{[\s\S]*\}/);
  return m ? m[0] : null;
}

export async function POST(req: NextRequest): Promise<NextResponse<SummarizeResponse | SummarizeError>> {
  if (!process.env.GEMINI_API_KEY)
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });

  let body: SummarizeRequest;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.text?.trim())
    return NextResponse.json({ error: "Text content is required." }, { status: 400 });

  const prompt = `${SYSTEM_PROMPT}

${body.filename ? `Source file: ${body.filename}\n` : ""}
---
${body.text.slice(0, 15000)}
---

Analyse and produce the JSON summary:`;

  for (const model of MODEL_CHAIN) {
    try {
      const ai = getAI();
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { maxOutputTokens: 2000, temperature: 0.2 },
      });
      const raw = result.text?.trim();
      if (!raw) continue;
      const jsonStr = extractJSON(raw);
      if (!jsonStr) continue;
      const parsed = JSON.parse(jsonStr) as SummarizeResponse;
      return NextResponse.json(parsed, { status: 200 });
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (msg.includes("429") || msg.includes("quota") || msg.includes("404") || msg.includes("503")) continue;
      break;
    }
  }
  return NextResponse.json({ error: "AI service is busy. Please try again in a moment." }, { status: 503 });
}
