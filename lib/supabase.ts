import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// ── Browser client (used in client components) ────────────────────────────────
// Safe to call on client — anon key only, Row Level Security enforces access.

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
});

// ── Is Supabase configured? ───────────────────────────────────────────────────
// Returns false when the env vars are still placeholder values — allows
// the app to fall back to localStorage so development works without a Supabase
// project.

export function isSupabaseConfigured(): boolean {
  return (
    !!supabaseUrl &&
    !!supabaseAnon &&
    !supabaseUrl.includes("your-project") &&
    !supabaseAnon.includes("your-anon-key")
  );
}
