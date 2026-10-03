import type {
  BriefFormData,
  ClientBrief,
  WebsiteResearch,
  GenerateBriefResponse,
  GenerateBriefError,
  ResearchWebsiteResponse,
  ResearchWebsiteError,
} from "@/types";

// ─── Generate brief ───────────────────────────────────────────────────────────

export async function generateBrief(
  formData: BriefFormData,
  websiteResearch?: WebsiteResearch
): Promise<ClientBrief> {
  const res = await fetch("/api/generate-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formData, websiteResearch }),
  });

  const json = (await res.json()) as GenerateBriefResponse | GenerateBriefError;

  if (!res.ok || "error" in json) {
    throw new Error(
      "error" in json ? json.error : "Failed to generate brief."
    );
  }

  return json.brief;
}

// ─── Analyze website ──────────────────────────────────────────────────────────

export async function analyzeWebsite(url: string): Promise<WebsiteResearch> {
  const res = await fetch("/api/research-website", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const json = (await res.json()) as ResearchWebsiteResponse | ResearchWebsiteError;

  // A 400 means bad URL — surface it directly
  if (res.status === 400 || "error" in json) {
    throw new Error(
      "error" in json ? json.error : "Website analysis failed."
    );
  }

  // 429 (quota) — surface directly
  if (res.status === 429 && "error" in json) {
    throw new Error(String((json as ResearchWebsiteError).error));
  }

  // For all other non-OK statuses return a graceful failure so the
  // Create page can still proceed to brief generation
  if (!res.ok) {
    return {
      success: false,
      failureReason: "Website analysis failed. You can continue with manual notes.",
      rawSummary: "",
    };
  }

  return (json as ResearchWebsiteResponse).research;
}
