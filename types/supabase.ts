// ── Supabase database type definitions ────────────────────────────────────────
// Auto-generate from your project with:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
//
// For now this is a hand-written version that matches our schema.

import type { BriefFormData, ClientBrief, WebsiteResearch, BriefStatus } from "@/types";

export interface Database {
  public: {
    Tables: {
      briefs: {
        Row: {
          id:               string;
          user_id:          string;
          created_at:       string;
          updated_at:       string;
          status:           BriefStatus;
          company_name:     string;
          website_url:      string | null;
          service:          string;
          notes:            string | null;
          brief_json:       ClientBrief | null;
          research_json:    WebsiteResearch | null;
        };
        Insert: {
          id?:              string;
          user_id:          string;
          created_at?:      string;
          updated_at?:      string;
          status?:          BriefStatus;
          company_name:     string;
          website_url?:     string | null;
          service:          string;
          notes?:           string | null;
          brief_json?:      ClientBrief | null;
          research_json?:   WebsiteResearch | null;
        };
        Update: {
          updated_at?:      string;
          status?:          BriefStatus;
          company_name?:    string;
          website_url?:     string | null;
          service?:         string;
          notes?:           string | null;
          brief_json?:      ClientBrief | null;
          research_json?:   WebsiteResearch | null;
        };
      };
    };
    Views:    Record<string, never>;
    Functions: Record<string, never>;
    Enums:    Record<string, never>;
  };
}

// ── SQL to create the table (run this in Supabase SQL editor) ─────────────────
//
// -- Enable UUID extension
// CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
//
// -- Briefs table
// CREATE TABLE public.briefs (
//   id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
//   created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   status         TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','draft')),
//   company_name   TEXT NOT NULL,
//   website_url    TEXT,
//   service        TEXT NOT NULL,
//   notes          TEXT,
//   brief_json     JSONB,
//   research_json  JSONB
// );
//
// -- Row Level Security: users can only access their own briefs
// ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "Users can select their own briefs"
//   ON public.briefs FOR SELECT
//   USING (auth.uid() = user_id);
//
// CREATE POLICY "Users can insert their own briefs"
//   ON public.briefs FOR INSERT
//   WITH CHECK (auth.uid() = user_id);
//
// CREATE POLICY "Users can update their own briefs"
//   ON public.briefs FOR UPDATE
//   USING (auth.uid() = user_id);
//
// CREATE POLICY "Users can delete their own briefs"
//   ON public.briefs FOR DELETE
//   USING (auth.uid() = user_id);
//
// -- Index for fast user-scoped queries
// CREATE INDEX briefs_user_id_created_at_idx ON public.briefs(user_id, created_at DESC);

export type BriefRow = Database["public"]["Tables"]["briefs"]["Row"];
