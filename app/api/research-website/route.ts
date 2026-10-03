import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type {
  WebsiteResearch,
  ResearchWebsiteResponse,
  ResearchWebsiteError,
} from "@/types";

// ─── Model fallback chain ─────────────────────────────────────────────────────
// Same chain as generate-brief so website analysis degrades gracefully.

const MODEL_CHAIN = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

const MAX_OUTPUT_TOKENS = 1500;
const MAX_CONTENT_CHARS = 12000;
const FETCH_TIMEOUT_MS = 10000;

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return _ai;
}

// ─── URL validation ───────────────────────────────────────────────────────────

function parseAndValidateUrl(raw: string): URL | null {
  try {
    const withScheme =
      raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const h = parsed.hostname.toLowerCase();
    if (
      h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h.endsWith(".local") ||
      /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)
    ) return null;
    return parsed;
  } catch { return null; }
}

// ─── HTML → readable text ─────────────────────────────────────────────────────

function extractReadableText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ");

  const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? `PAGE TITLE: ${titleMatch[1].trim()}\n\n` : "";

  const descMatch = text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const metaDesc = descMatch ? `META DESCRIPTION: ${descMatch[1].trim()}\n\n` : "";

  const ogMatch = text.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const ogDesc = ogMatch ? `OG DESCRIPTION: ${ogMatch[1].trim()}\n\n` : "";

  const stripped = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ").trim();

  return (title + metaDesc + ogDesc + stripped).slice(0, MAX_CONTENT_CHARS);
}

// ─── Research prompt ──────────────────────────────────────────────────────────

const RESEARCH_PROMPT_PREFIX = `You are a business research assistant for a freelance web developer.
Analyze the website content below and extract factual business information.

RULES:
1. Only report what is ACTUALLY in the content. Never invent facts.
2. Prefix labels: [FACT] for stated info, [POSSIBLE OPPORTUNITY] for observations, [NEEDS CONFIRMATION] for unknowns.
3. Lists: max 6 items each.

RESPOND WITH ONLY A VALID JSON OBJECT — no markdown, no code fences, no text before or after.

Required structure:
{
  "businessName": "string or null",
  "industry": "string or null",
  "whatItDoes": "1-2 sentences",
  "servicesProducts": ["string"],
  "targetAudience": "string or null",
  "valueProposition": "string or null",
  "callsToAction": ["string"],
  "existingWebsiteFeatures": ["string"],
  "potentialOpportunities": ["[POSSIBLE OPPORTUNITY] string"],
  "needsConfirmation": ["[NEEDS CONFIRMATION] string"],
  "keyMessaging": "string or null",
  "contactInfo": "string or null",
  "rawSummary": "3-5 sentence plain-English summary of the business and website"
}

`;

// ─── JSON extractor ───────────────────────────────────────────────────────────

function extractJSON(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const stripped = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  if (stripped.startsWith("{")) return stripped;
  const match = stripped.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

// ─── Graceful failure helper ──────────────────────────────────────────────────

function graceful(reason: string): WebsiteResearch {
  return { success: false, failureReason: reason, rawSummary: "" };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest
): Promise<NextResponse<ResearchWebsiteResponse | ResearchWebsiteError>> {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error. Please contact support." },
      { status: 500 }
    );
  }

  let url: string;
  try {
    const body = await req.json();
    url = body.url;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!url?.trim())
    return NextResponse.json({ error: "URL is required." }, { status: 400 });

  const parsed = parseAndValidateUrl(url.trim());
  if (!parsed) {
    return NextResponse.json(
      { error: "Please enter a valid, publicly accessible website URL." },
      { status: 400 }
    );
  }

  // ── Step 1: Fetch website ─────────────────────────────────────────────────
  let rawHtml: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timer);

    if (!response.ok) {
      return NextResponse.json(
        { research: graceful(`Website returned HTTP ${response.status}. It may be unavailable or require a login.`) },
        { status: 200 }
      );
    }
    const ct = response.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) {
      return NextResponse.json(
        { research: graceful("Unsupported content type — the URL may point to a PDF or image.") },
        { status: 200 }
      );
    }
    rawHtml = await response.text();
  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error && (err.name === "AbortError" || err.message.includes("abort"));
    return NextResponse.json(
      { research: graceful(isTimeout ? "Website took too long to respond (10s)." : "Could not reach the website. It may be offline or blocking access.") },
      { status: 200 }
    );
  }

  // ── Step 2: Extract text ──────────────────────────────────────────────────
  const pageText = extractReadableText(rawHtml);
  if (pageText.trim().length < 100) {
    return NextResponse.json(
      { research: graceful("Website had very little readable text — it may be JavaScript-rendered and require a browser to load.") },
      { status: 200 }
    );
  }

  const contents = `${RESEARCH_PROMPT_PREFIX}Website content from ${parsed.hostname}:\n\n---\n${pageText}\n---\n\nNow generate the JSON object:`;

  // ── Step 3: Try each model in chain ───────────────────────────────────────
  for (const model of MODEL_CHAIN) {
    try {
      const ai = getAI();
      const result = await ai.models.generateContent({
        model,
        contents,
        config: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.2 },
      });

      const raw = result.text;
      if (!raw?.trim()) continue; // try next model

      const jsonStr = extractJSON(raw);
      if (!jsonStr) {
        console.error(`[research-website] No JSON from ${model}:`, raw.slice(0, 150));
        continue; // try next model
      }

      let extracted: Omit<WebsiteResearch, "success">;
      try {
        extracted = JSON.parse(jsonStr);
      } catch {
        console.error(`[research-website] JSON parse failed for ${model}`);
        continue; // try next model
      }

      console.log(`[research-website] Success with model: ${model}`);
      return NextResponse.json(
        { research: { success: true, ...extracted } },
        { status: 200 }
      );

    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      console.error(`[research-website] ${model} failed:`, err instanceof Error ? err.constructor.name : typeof err);

      // For rate-limit, unavailable, or removed models — try next in chain
      if (
        msg.includes("429") || msg.includes("quota") || msg.includes("rate") ||
        msg.includes("404") || msg.includes("not found") || msg.includes("no longer available") ||
        msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand")
      ) {
        continue;
      }

      // Auth failure — stop immediately, return graceful so user can still create brief
      if (msg.includes("401") || msg.includes("api_key_invalid")) {
        return NextResponse.json(
          { research: graceful("Website analysis is unavailable due to a configuration issue. You can still create a brief using your notes.") },
          { status: 200 }
        );
      }

      continue;
    }
  }

  // ── All models exhausted — return graceful failure so brief gen still works
  console.warn("[research-website] All models exhausted, returning graceful failure");
  return NextResponse.json(
    {
      research: graceful(
        "Website research is temporarily unavailable. You can still generate a great brief using your notes below."
      ),
    },
    { status: 200 }
  );
}
