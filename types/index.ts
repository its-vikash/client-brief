// ─── Input form data ──────────────────────────────────────────────────────────

export interface BriefFormData {
  companyName: string;
  websiteUrl: string;
  service: string;
  notes: string;
}

// ─── Website research ─────────────────────────────────────────────────────────

export interface WebsiteResearch {
  success: boolean;
  failureReason?: string;
  businessName?: string;
  industry?: string;
  whatItDoes?: string;
  servicesProducts?: string[];
  targetAudience?: string;
  valueProposition?: string;
  callsToAction?: string[];
  existingWebsiteFeatures?: string[];
  potentialOpportunities?: string[];
  needsConfirmation?: string[];
  keyMessaging?: string;
  contactInfo?: string;
  rawSummary: string;
}

// ─── Structured brief ─────────────────────────────────────────────────────────

export interface ClientBrief {
  companyOverview: string;
  businessAndIndustry: string;
  whatWeKnow: string;
  existingDigitalPresence: string;
  likelyClientGoals: string;
  potentialOpportunities: string[];
  keyTalkingPoints: string[];
  questionsToAsk: string[];
  potentialConcerns: string[];
  informationStillMissing: string[];
  suggestedMeetingOpening: string;
  recommendedNextStep: string;
}

// ─── Brief record ─────────────────────────────────────────────────────────────

export type BriefStatus = "ready" | "draft";

export interface BriefRecord {
  id: string;
  /** The userId of the owner — used to scope data per user */
  userId: string;
  createdAt: string;
  updatedAt?: string;
  status: BriefStatus;
  input: BriefFormData;
  /** Present once AI generation has run; absent for drafts */
  brief?: ClientBrief;
  websiteResearch?: WebsiteResearch;
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface GenerateBriefRequest {
  formData: BriefFormData;
  websiteResearch?: WebsiteResearch;
}

export interface GenerateBriefResponse {
  brief: ClientBrief;
}

export interface GenerateBriefError {
  error: string;
}

export interface ResearchWebsiteRequest {
  url: string;
}

export interface ResearchWebsiteResponse {
  research: WebsiteResearch;
}

export interface ResearchWebsiteError {
  error: string;
}
