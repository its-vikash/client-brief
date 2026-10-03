# PreConvara

> **Prepare for better client conversations.**

PreConvara is an AI-powered meeting preparation tool for freelance web developers and small digital agencies. It transforms a client name, website URL, and your notes into a sharp, structured brief — talking points, discovery questions, watchouts, and a suggested opening — in under 30 seconds.

---

## Features

| Feature | Description |
|---|---|
| **Client Briefs** | 12-section AI brief from client name, website, call type and notes |
| **Website Research** | Auto-fetches and analyses prospect's website to enrich the brief |
| **AI Create** | Turn transcripts into Meeting Summaries, Emails, Agendas, Project Docs and more |
| **Transcripts** | Upload .txt/.srt/.vtt — AI extracts decisions, action items, key points |
| **Ask AI** | Free-form assistant for priorities, roadmaps, emails, proposals |
| **Appointments** | Schedule client calls with Google Calendar invite generation |
| **Google Calendar** | One-click follow-up event from any brief |
| **WhatsApp** | Send brief summary to any WhatsApp number |
| **Slack** | Send AI-formatted brief summaries to Slack channels |
| **Gmail** | Pull and summarise email threads by company name (OAuth) |
| **Draft saving** | Save context without generating — complete later |
| **FAQ & Help** | In-app FAQ, AI chat widget, public help centre |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4, custom CSS design tokens
- **AI:** Google Gemini API (`gemini-3.5-flash` with 2 fallback models)
- **Auth:** localStorage-based with SHA-256 password hashing (Supabase-ready)
- **Database:** localStorage per-user (Supabase PostgreSQL + RLS when configured)
- **Fonts:** Bricolage Grotesque (headings), DM Sans (body), Space Mono (code)

---

## Project Structure

```
client-brief/
├── app/
│   ├── (app)/dashboard/        # Authenticated pages
│   │   ├── page.tsx            # Dashboard
│   │   ├── create/             # New brief form
│   │   ├── create-doc/         # AI Create (transcript → document)
│   │   ├── transcripts/        # Upload & summarise transcripts
│   │   ├── ask/                # Free-form AI assistant
│   │   ├── schedule/           # Appointment scheduling
│   │   ├── faq/                # In-app FAQ
│   │   ├── brief/[id]/         # Brief detail view
│   │   └── integrations/
│   │       ├── gmail/          # Gmail integration
│   │       └── slack/          # Slack integration
│   ├── (auth)/                 # Login, signup, forgot password
│   ├── (public)/               # Landing, FAQ, Help, Contact, Legal
│   └── api/                    # Server-side API routes
│       ├── generate-brief/     # Core brief generation (Gemini)
│       ├── research-website/   # Website analysis (Gemini)
│       ├── chat/               # AI chat widget
│       ├── ask/                # Ask AI assistant
│       ├── create-doc/         # Transcript → document
│       ├── summarize/          # Transcript summarisation
│       ├── calendar/           # Google Calendar link generation
│       ├── whatsapp/           # WhatsApp deep-link generation
│       ├── schedule/           # Appointment scheduling
│       └── integrations/
│           ├── gmail/          # Gmail OAuth + thread fetching
│           └── slack/          # Slack message sending
├── components/                 # Shared UI components
├── lib/
│   ├── auth.ts                 # Authentication (localStorage + Supabase)
│   ├── storage.ts              # Data layer (localStorage + Supabase)
│   ├── api.ts                  # Client-side fetch wrappers
│   └── supabase.ts             # Supabase client
└── types/
    ├── index.ts                # App-wide TypeScript types
    └── supabase.ts             # Database schema types
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier: 1,500 req/day)

### 1. Clone and install

```bash
git clone https://github.com/your-org/preconvara.git
cd preconvara
npm install
```

### 2. Environment variables

Copy the example and fill in your keys:

```bash
cp .env.local.example .env.local
```

Open `.env.local`:

```env
# ── Required ──────────────────────────────────────────────────────────────────
# Google Gemini API — get free key at https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# ── Supabase (optional — enables real database + auth) ────────────────────────
# Create project at https://supabase.com → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# ── Gmail integration (optional) ─────────────────────────────────────────────
# Create at console.cloud.google.com → Enable Gmail API → OAuth credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/gmail/callback

# ── Slack integration (optional) ──────────────────────────────────────────────
# Create at api.slack.com/apps → Bot Token Scopes: chat:write
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_DEFAULT_CHANNEL=#preconvara-summaries
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for production

```bash
npm run build
npm start
```

---

## Supabase Setup (Optional but Recommended)

Without Supabase, the app uses localStorage — data lives in the browser only. To enable real persistent storage with multi-device support:

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the SQL schema in the **SQL Editor**:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own briefs" ON public.briefs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX briefs_user_created_idx ON public.briefs(user_id, created_at DESC);
```

3. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
4. Restart the dev server — Supabase activates automatically

---

## Gmail Integration Setup

The Gmail integration requires Google OAuth2 with read-only Gmail access.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → New project
2. Enable the **Gmail API** under APIs & Services → Library
3. Create **OAuth 2.0 credentials** → Web application
4. Add authorised redirect URI: `http://localhost:3000/api/integrations/gmail/callback`
5. Set OAuth consent screen to **External** (not Internal — otherwise only org users can sign in)
6. Add your Gmail address as a **Test user**
7. Add credentials to `.env.local` and restart

---

## Slack Integration Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → Create New App → From scratch
2. Under **OAuth & Permissions** → Bot Token Scopes → add `chat:write`
3. Install to workspace → copy the **Bot User OAuth Token** (`xoxb-...`)
4. Add `SLACK_BOT_TOKEN` and `SLACK_DEFAULT_CHANNEL` to `.env.local`
5. Restart the server
6. Invite the bot to your channel: `/invite @YourAppName`

---

## AI Model Configuration

All AI calls use a 3-model fallback chain for reliability:

```
gemini-3.5-flash → gemini-3.5-flash-lite → gemini-3.1-flash-lite
```

If the first model is rate-limited, the next is tried automatically. Configuration is in:
- `app/api/generate-brief/route.ts` — brief generation
- `app/api/research-website/route.ts` — website analysis
- `app/api/chat/route.ts` — AI chat widget
- `app/api/ask/route.ts` — Ask AI assistant
- `app/api/create-doc/route.ts` — document generation

---

## Security Notes

- `GEMINI_API_KEY` is server-side only — never exposed to the browser
- Passwords are hashed with SHA-256 via the Web Crypto API
- Supabase Row Level Security enforces per-user data isolation at the database level
- URL validation blocks server-side requests to private IP ranges (localhost, 10.x, 192.168.x)
- Gmail OAuth tokens stored in HTTP-only cookies (not accessible to JavaScript)

---

## Available Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Reset password |
| `/dashboard` | Main dashboard |
| `/dashboard/create` | New brief form |
| `/dashboard/create-doc` | AI Create (transcript → document) |
| `/dashboard/transcripts` | Upload & summarise transcripts |
| `/dashboard/ask` | Ask AI assistant |
| `/dashboard/schedule` | Appointment scheduling |
| `/dashboard/brief/[id]` | Brief detail |
| `/dashboard/integrations/gmail` | Gmail integration |
| `/dashboard/integrations/slack` | Slack integration |
| `/dashboard/faq` | In-app FAQ |
| `/faq` | Public FAQ |
| `/help` | Help centre |
| `/contact` | Contact form |
| `/legal/privacy` | Privacy Policy |
| `/legal/terms` | Terms of Service |
| `/legal/cookies` | Cookie Policy |
| `/legal/ai-policy` | AI Policy |
| `/legal/security` | Security |
| `/legal/dpa` | Data Processing Agreement |
| `/legal/subprocessors` | Subprocessors |

---

## Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## Roadmap

- [ ] Gmail full integration (OAuth complete, pull threads live)
- [ ] Slack real-time brief summaries
- [ ] HubSpot / Salesforce CRM sync
- [ ] Stripe subscription billing
- [ ] Team accounts and shared workspaces
- [ ] Google Calendar full OAuth (auto-create events)
- [ ] Advanced analytics and call outcome tracking
- [ ] Mobile app (React Native)

---

## Acknowledgements

- [Google Gemini](https://ai.google.dev/) — AI generation
- [Supabase](https://supabase.com) — Database & auth backend
- [Next.js](https://nextjs.org/) — Framework
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Lucide React](https://lucide.dev/) — Icons
- [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) — Heading font

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ for freelancers and agencies who want to walk into every client call fully prepared.*
