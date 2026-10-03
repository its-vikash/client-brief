// ── WhatsApp — Send brief to phone ───────────────────────────────────────────
//
// This route generates a wa.me deep-link that pre-fills a WhatsApp message
// with a formatted brief summary. The user taps the link and WhatsApp opens
// with the message ready to send to themselves (or anyone).
//
// No API keys required — wa.me is a free public deep-link standard.
//
// To upgrade to the WhatsApp Business API (automated sending without user click):
//   1. Create a Meta Business Account
//   2. Set up a WhatsApp Business phone number
//   3. Add WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID to .env.local
//   4. Call the Graph API: POST /messages with type "text"

import { NextRequest, NextResponse } from "next/server";

interface WhatsAppRequest {
  companyName:         string;
  service:             string;
  companyOverview?:    string;
  keyTalkingPoints?:   string[];
  questionsToAsk?:     string[];
  suggestedOpening?:   string;
  recommendedNextStep?: string;
  briefId:             string;
  /** Optional: recipient phone number with country code, e.g. +447911123456 */
  phone?: string;
}

interface WhatsAppResponse {
  url:     string;
  message: string;
}

interface WhatsAppError {
  error: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<WhatsAppResponse | WhatsAppError>> {
  let body: WhatsAppRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.companyName?.trim()) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }

  const serviceShort = body.service?.split("(")[0].trim() ?? body.service;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const briefUrl = `${appUrl}/dashboard/brief/${body.briefId}`;

  // Build a clean, readable plain-text brief for WhatsApp
  const lines: string[] = [
    `📋 *CLIENT BRIEF — ${body.companyName}*`,
    `Service: ${serviceShort}`,
    "",
  ];

  if (body.companyOverview) {
    lines.push("*Overview*");
    lines.push(body.companyOverview);
    lines.push("");
  }

  if (body.keyTalkingPoints?.length) {
    lines.push("*Key Talking Points*");
    body.keyTalkingPoints.slice(0, 5).forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    lines.push("");
  }

  if (body.questionsToAsk?.length) {
    lines.push("*Questions to Ask*");
    body.questionsToAsk.slice(0, 4).forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    lines.push("");
  }

  if (body.suggestedOpening) {
    lines.push("*Suggested Opening*");
    lines.push(`_${body.suggestedOpening}_`);
    lines.push("");
  }

  if (body.recommendedNextStep) {
    lines.push("*Next Step*");
    lines.push(body.recommendedNextStep);
    lines.push("");
  }

  lines.push(`🔗 Full brief: ${briefUrl}`);

  const message = lines.join("\n");

  // wa.me deep link — phone is optional (opens contact picker if omitted)
  const phone   = body.phone ? body.phone.replace(/[^0-9]/g, "") : "";
  const encoded = encodeURIComponent(message);
  const url     = phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  return NextResponse.json({ url, message }, { status: 200 });
}
