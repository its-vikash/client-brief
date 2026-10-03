# Supabase Setup Guide

PreConvara uses Supabase for production auth and database.
When the env vars are not set it falls back to localStorage automatically.

---

## 1. Create a project

1. Go to https://supabase.com → New project
2. Copy your **Project URL** and **anon public key** from:
   Project Settings → API

---

## 2. Add env vars

Open `.env.local` and replace the placeholders:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 3. Run the SQL schema

Open the **SQL Editor** in your Supabase dashboard and run this:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Briefs table
CREATE TABLE public.briefs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status         TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','draft')),
  company_name   TEXT NOT NULL,
  website_url    TEXT,
  service        TEXT NOT NULL,
  notes          TEXT,
  brief_json     JSONB,
  research_json  JSONB
);

-- Row Level Security — users can ONLY access their own rows
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own"  ON public.briefs FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "insert_own"  ON public.briefs FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own"  ON public.briefs FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "delete_own"  ON public.briefs FOR DELETE  USING (auth.uid() = user_id);

-- Index for fast per-user queries
CREATE INDEX briefs_user_created_idx ON public.briefs(user_id, created_at DESC);
```

---

## 4. Configure Supabase Auth

In your Supabase dashboard → **Authentication → Settings**:

- Confirm email: **OFF** (or ON if you want email verification)
- Site URL: `http://localhost:3000` (dev) / your production URL

---

## 5. Restart dev server

```bash
npm run dev
```

The app detects the env vars and switches to Supabase automatically.
No code changes needed.

---

## 6. Forgot password (with real email)

Once Supabase is connected, the forgot-password flow can be upgraded to
send a real reset email. Add this to your forgot-password page:

```ts
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://yourapp.com/update-password',
});
```

---

## Security checklist

- [x] Passwords never stored in plain text (Supabase handles bcrypt)
- [x] Row Level Security enabled — users can only read/write their own briefs
- [x] `user_id` is set from the authenticated JWT, not from the client
- [x] GEMINI_API_KEY is server-side only (no NEXT_PUBLIC_ prefix)
- [x] Anon key is safe to expose (RLS prevents cross-user access)
- [ ] Email confirmation (enable in Supabase Auth settings for production)
- [ ] Rate limiting (add at Supabase edge or Vercel level for production)
