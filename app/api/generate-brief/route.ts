import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type {
  BriefFormData,
  ClientBrief,
  WebsiteResearch,
  GenerateBriefResponse,
  GenerateBriefError,
} from "@/types";

// ─── Model fallback chain ─────────────────────────────────────────────────────
// Tried in order. If the first is rate-limited or unavailable, the next is used.
// Never expose these names to the user — they are internal implementation details.

const MODEL_CHAIN = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

const MAX_OUTPUT_TOKENS = 3000;
const TEMPERATURE = 0.4;

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return _ai;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const PROMPT_PREFIX = `You are an expert client-meeting preparation assistant for freelance web developers and small digital agencies.

Your task: produce a concise, practical client brief a freelancer can read in 2–3 minutes before a call.

RULES:
1. Never fabricate facts, budgets, timelines, or requirements not explicitly supplied.
2. Label information sources:
   [From Website] — found via website analysis
   [From User Notes] — explicitly provided by the user
   [AI Observation] — reasonable inference, clearly flagged
   [Needs Confirmation] — unverified, needs clarifying on the call
3. Be specific and practical — no generic filler.
4. Write plain English, professional but not stuffy.
5. List items: 3–7 items each. Full sentences, not fragments.

YOU MUST RESPOND WITH ONLY A VALID JSON OBJECT.
NO text before the opening brace. NO text after the closing brace.
NO markdown code fences. NO commentary.
JUST the raw JSON object starting with { and ending with }

Required JSON structure:
{
  "companyOverview": "2-3 sentence factual summary with source labels",
  "businessAndIndustry": "what the company does, industry, who they serve",
  "whatWeKnow": "confirmed facts from website and notes, with source labels",
  "existingDigitalPresence": "observations about current website or digital footprint",
  "likelyClientGoals": "inferences about what they want from this engagement, labeled [AI Observation]",
  "potentialOpportunities": ["specific opportunity 1", "specific opportunity 2", "specific opportunity 3"],
  "keyTalkingPoints": ["talking point 1", "talking point 2", "talking point 3", "talking point 4", "talking point 5"],
  "questionsToAsk": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "potentialConcerns": ["concern or objection 1", "concern or objection 2", "concern or objection 3"],
  "informationStillMissing": ["[Needs Confirmation] gap 1", "[Needs Confirmation] gap 2", "[Needs Confirmation] gap 3"],
  "suggestedMeetingOpening": "natural 2-4 sentence opening the freelancer can say on the call",
  "recommendedNextStep": "one clear specific next step to advance or close after the call"
}

`;

// ─── Build prompt ─────────────────────────────────────────────────────────────

function buildPrompt(data: BriefFormData, websiteResearch?: WebsiteResearch): string {
  const parts: string[] = [
    PROMPT_PREFIX,
    "CLIENT INFORMATION:",
    `Company Name: ${data.companyName}`,
    `Website URL: ${data.websiteUrl || "Not provided"}`,
    `Service Interested In: ${data.service}`,
    "",
    "Previous Conversation / Notes:",
    data.notes?.trim() || "None provided.",
    "",
  ];

  if (websiteResearch?.success) {
    parts.push("WEBSITE RESEARCH (extracted from prospect's website):");
    if (websiteResearch.businessName)  parts.push(`Business Name: ${websiteResearch.businessName}`);
    if (websiteResearch.industry)      parts.push(`Industry: ${websiteResearch.industry}`);
    if (websiteResearch.whatItDoes)    parts.push(`What It Does: ${websiteResearch.whatItDoes}`);
    if (websiteResearch.targetAudience) parts.push(`Target Audience: ${websiteResearch.targetAudience}`);
    if (websiteResearch.valueProposition) parts.push(`Value Proposition: ${websiteResearch.valueProposition}`);
    if (websiteResearch.keyMessaging)  parts.push(`Key Messaging: ${websiteResearch.keyMessaging}`);
    if (websiteResearch.contactInfo)   parts.push(`Contact Info: ${websiteResearch.contactInfo}`);
    if (websiteResearch.servicesProducts?.length)
      parts.push(`Services/Products: ${websiteResearch.servicesProducts.join(", ")}`);
    if (websiteResearch.callsToAction?.length)
      parts.push(`Calls to Action: ${websiteResearch.callsToAction.join(", ")}`);
    if (websiteResearch.existingWebsiteFeatures?.length)
      parts.push(`Existing Features: ${websiteResearch.existingWebsiteFeatures.join(", ")}`);
    if (websiteResearch.potentialOpportunities?.length)
      parts.push(`Observed Opportunities: ${websiteResearch.potentialOpportunities.join(", ")}`);
    if (websiteResearch.rawSummary)
      parts.push(`Summary: ${websiteResearch.rawSummary}`);
  } else if (websiteResearch && !websiteResearch.success) {
    parts.push(`WEBSITE RESEARCH: Could not be completed — ${websiteResearch.failureReason}`);
    parts.push("Base the brief on the user-provided information only.");
  } else {
    parts.push("WEBSITE RESEARCH: Not performed. Use only the information provided above.");
  }

  parts.push("");
  parts.push("Now generate the client brief JSON object:");
  return parts.join("\n");
}

// ─── JSON extractor ───────────────────────────────────────────────────────────

function extractJSON(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const stripped = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  if (stripped.startsWith("{")) return stripped;
  const match = stripped.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

// ─── Attempt generation with one model ───────────────────────────────────────

async function tryGenerate(model: string, prompt: string): Promise<string> {
  const ai = getAI();
  const result = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: TEMPERATURE },
  });
  const raw = result.text;
  if (!raw?.trim()) throw new Error("EMPTY_RESPONSE");
  return raw;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateBriefResponse | GenerateBriefError>> {
  if (!process.env.GEMINI_API_KEY) {
    console.error("[generate-brief] GEMINI_API_KEY is not set");
    return NextResponse.json(
      { error: "Server configuration error. Please contact support." },
      { status: 500 }
    );
  }

  let formData: BriefFormData;
  let websiteResearch: WebsiteResearch | undefined;

  try {
    const body = await request.json();
    formData = body.formData;
    websiteResearch = body.websiteResearch;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!formData?.companyName?.trim())
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  if (!formData?.service?.trim())
    return NextResponse.json({ error: "Service type is required." }, { status: 400 });

  const prompt = buildPrompt(formData, websiteResearch);
  let lastError: unknown = null;

  // ── Try each model in the chain ───────────────────────────────────────────
  for (const model of MODEL_CHAIN) {
    try {
      const raw = await tryGenerate(model, prompt);

      const jsonStr = extractJSON(raw);
      if (!jsonStr) {
        console.error(`[generate-brief] No JSON in response from ${model}:`, raw.slice(0, 200));
        lastError = new Error("FORMAT_ERROR");
        continue; // try next model
      }

      let brief: ClientBrief;
      try {
        brief = JSON.parse(jsonStr) as ClientBrief;
      } catch {
        console.error(`[generate-brief] JSON parse failed for ${model}:`, jsonStr.slice(0, 200));
        lastError = new Error("PARSE_ERROR");
        continue; // try next model
      }

      console.log(`[generate-brief] Success with model: ${model}`);
      return NextResponse.json({ brief }, { status: 200 });

    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      console.error(`[generate-brief] ${model} failed:`, err instanceof Error ? err.constructor.name : typeof err);

      if (msg.includes("429") || msg.includes("quota") || msg.includes("rate")) {
        // Rate-limited — try next model in chain
        lastError = err;
        continue;
      }
      if (msg.includes("404") || msg.includes("not found") || msg.includes("no longer available")) {
        // Model removed — try next model in chain
        lastError = err;
        continue;
      }
      if (msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand")) {
        // Server busy — try next model in chain
        lastError = err;
        continue;
      }
      if (msg.includes("empty_response")) {
        lastError = err;
        continue;
      }

      // Unrecoverable error (auth, etc.) — stop immediately
      if (msg.includes("401") || msg.includes("api_key_invalid")) {
        return NextResponse.json(
          { error: "Configuration error. Please contact support." },
          { status: 500 }
        );
      }

      lastError = err;
      continue;
    }
  }

  // ── All models exhausted ──────────────────────────────────────────────────
  console.error("[generate-brief] All models in chain exhausted. Last error:", lastError);
  const lastMsg = (lastError instanceof Error ? lastError.message : String(lastError)).toLowerCase();

  if (lastMsg.includes("parse_error") || lastMsg.includes("format_error")) {
    return NextResponse.json(
      { error: "The AI returned an unexpected format. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error:
        "Our AI service is currently busy. Please wait a moment and try again — your form data is saved.",
    },
    { status: 503 }
  );
}
