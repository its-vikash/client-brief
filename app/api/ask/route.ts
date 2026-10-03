import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL_CHAIN = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];

let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return _ai;
}

const SYSTEM_PROMPT = `You are a highly capable AI assistant for freelance web developers, designers, and small digital agencies.

You specialise in:
- Drafting client-facing documents (emails, proposals, project updates)
- Creating structured outputs (priority lists, roadmaps, agendas, scorecards)
- Summarising context and surfacing key priorities
- Writing professional communications

RULES:
1. Be concise and practical — users are busy freelancers
2. Use clear formatting with headers and bullet points where appropriate
3. Always produce something immediately usable, not just advice
4. If asked for a document/email/list, produce the full thing, ready to use
5. Never say "I cannot" — find a way to be helpful`;

export interface AskRequest {
  prompt:   string;
  context?: string;  // optional brief/notes context to make answers more specific
}

export interface AskResponse {
  answer: string;
}

export interface AskError { error: string; }

export async function POST(req: NextRequest): Promise<NextResponse<AskResponse | AskError>> {
  if (!process.env.GEMINI_API_KEY)
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });

  let body: AskRequest;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.prompt?.trim())
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });

  const fullPrompt = body.context?.trim()
    ? `${SYSTEM_PROMPT}\n\nCONTEXT PROVIDED BY USER:\n${body.context.slice(0, 3000)}\n\nUSER REQUEST:\n${body.prompt}`
    : `${SYSTEM_PROMPT}\n\nUSER REQUEST:\n${body.prompt}`;

  for (const model of MODEL_CHAIN) {
    try {
      const ai = getAI();
      const result = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: { maxOutputTokens: 2500, temperature: 0.5 },
      });
      const text = result.text?.trim();
      if (!text) continue;
      return NextResponse.json({ answer: text }, { status: 200 });
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (msg.includes("429") || msg.includes("quota") || msg.includes("404") || msg.includes("503")) continue;
      break;
    }
  }
  return NextResponse.json({ error: "AI service is busy. Please try again in a moment." }, { status: 503 });
}
