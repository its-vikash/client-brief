import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// ── Model fallback chain ──────────────────────────────────────────────────────
const MODEL_CHAIN = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];

let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return _ai;
}

// ── Built-in templates ────────────────────────────────────────────────────────
const TEMPLATES: Record<string, string> = {
  meeting_summary: `You are an expert document writer. Transform the following meeting transcript into a clean, professional Meeting Summary document.

Structure:
# Meeting Summary
**Date:** [extract or write "Not specified"]
**Attendees:** [list names mentioned]
**Duration:** [if mentioned]

## Key Discussion Points
[bullet points of main topics]

## Decisions Made
[numbered list of decisions]

## Action Items
| Owner | Task | Due Date |
|-------|------|----------|
[extract action items]

## Next Steps
[brief paragraph]`,

  follow_up_email: `You are an expert business writer. Transform the following meeting transcript into a professional, ready-to-send follow-up email.

Write a complete email with:
- Professional subject line
- Warm opening referencing the meeting
- Summary of what was discussed (2-3 sentences)
- Clear list of agreed next steps with owners
- Your closing and signature placeholder

Tone: Professional but warm. Concise. Action-oriented.`,

  next_agenda: `You are a professional meeting facilitator. Based on this meeting transcript, create a detailed agenda for the NEXT meeting.

Format:
# Next Meeting Agenda
**Suggested Duration:** [estimate]
**Recommended Attendees:** [based on open items]

## Agenda Items
1. [item] — [owner] — [time allocation]
2. ...

## Pre-Meeting Preparation Required
- [what attendees should prepare]

## Goals for This Meeting
[what success looks like]`,

  project_document: `You are a senior project manager. Transform this meeting transcript into a structured Project Document.

Format:
# Project Overview
[2-3 sentence project description]

## Objectives
[numbered list]

## Scope
### In Scope
- [items]
### Out of Scope  
- [items]

## Key Milestones
| Milestone | Owner | Target Date |
|-----------|-------|-------------|

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|

## Stakeholders
[list with roles]`,

  customer_feedback: `You are a customer success analyst. Transform this transcript into a structured Customer Feedback Report.

Format:
# Customer Feedback Report
**Customer:** [extract name/company]
**Date:** [extract or "Not specified"]
**Sentiment:** [Positive/Mixed/Negative based on content]

## Key Feedback Themes
[group feedback into themes]

## Positive Highlights
[what the customer liked]

## Pain Points & Concerns
[what needs addressing]

## Feature Requests
[explicit or implied requests]

## Recommended Actions
[prioritised list for the team]`,

  interview_scorecard: `You are an experienced hiring manager. Transform this interview transcript into a professional Interview Scorecard.

Format:
# Interview Scorecard
**Candidate:** [extract name]
**Role:** [extract or "Not specified"]
**Interviewer:** [extract or "Not specified"]

## Competency Ratings
| Competency | Rating (1-5) | Evidence from Interview |
|------------|-------------|------------------------|
| Technical Skills | | |
| Communication | | |
| Problem Solving | | |
| Culture Fit | | |
| Leadership | | |

## Strengths
[bullet points]

## Areas of Concern
[bullet points]

## Overall Recommendation
[ ] Strong Yes  [ ] Yes  [ ] Maybe  [ ] No

## Hiring Manager Notes
[summary paragraph]`,

  priorities_list: `You are a productivity expert. Extract and organise the key priorities from this transcript or meeting notes.

Format:
# Priority List
**Period:** [extract timeframe or "This Week"]

## 🔴 Critical (Must Do)
1. [task] — [owner] — [deadline if mentioned]

## 🟡 Important (Should Do)
1. [task] — [owner]

## 🟢 Nice to Have
1. [task]

## Blocked Items
[anything waiting on something else]

## Notes
[any important context]`,
};

// ── Route ─────────────────────────────────────────────────────────────────────
export interface CreateDocRequest {
  transcript:    string;
  templateKey?:  string;   // one of the TEMPLATES keys, or "custom"
  customPrompt?: string;   // used when templateKey === "custom"
}

export interface CreateDocResponse {
  document: string;
  templateUsed: string;
}

export interface CreateDocError { error: string; }

export async function POST(req: NextRequest): Promise<NextResponse<CreateDocResponse | CreateDocError>> {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  let body: CreateDocRequest;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.transcript?.trim()) {
    return NextResponse.json({ error: "Transcript text is required." }, { status: 400 });
  }

  const templateKey = body.templateKey ?? "meeting_summary";
  const systemPrompt = templateKey === "custom"
    ? (body.customPrompt?.trim() || "Summarise this transcript clearly and professionally.")
    : TEMPLATES[templateKey] ?? TEMPLATES.meeting_summary;

  const fullPrompt = `${systemPrompt}

---
TRANSCRIPT:
${body.transcript.slice(0, 15000)}
---

Now produce the document:`;

  for (const model of MODEL_CHAIN) {
    try {
      const ai = getAI();
      const result = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: { maxOutputTokens: 3000, temperature: 0.4 },
      });
      const text = result.text?.trim();
      if (!text) continue;
      return NextResponse.json({ document: text, templateUsed: templateKey }, { status: 200 });
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (msg.includes("429") || msg.includes("quota") || msg.includes("404") || msg.includes("503")) continue;
      break;
    }
  }

  return NextResponse.json({ error: "AI service is busy. Please try again in a moment." }, { status: 503 });
}
