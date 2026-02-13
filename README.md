# FunnelForge

**AI-powered marketing funnel content engine.** Upload your brand documents, let AI analyze your unique voice, and generate full-funnel content across 7 channels — in seconds.

## Features

- **Brand Persona Analysis** — Upload PDFs, DOCX, CSV, or TXT files. Claude extracts your tone, audience, values, vocabulary, and content patterns.
- **Full-Funnel Generation** — Get Awareness, Consideration, and Conversion content for each channel.
- **7 Channels** — LinkedIn, Instagram, Twitter/X, Email, Blog, Facebook, TikTok.
- **Copy & Export** — One-click copy any piece, or export the entire plan as JSON.
- **Generation History** — Every generation is saved and browsable.
- **Rate Limiting** — 10 generations per user per hour.

## Tech Stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Framework  | Next.js 14 (App Router, TypeScript)         |
| Styling    | Tailwind CSS, DM Sans + Fraunces fonts      |
| Auth & DB  | Supabase (PostgreSQL, Auth, Storage)         |
| AI         | Anthropic Claude API (claude-sonnet-4-20250514) |
| Deployment | Vercel                                      |

## Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key

---

## Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd funnelforge
npm install
```

### 2. Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Note your **Project URL** and **anon public key** from **Settings → API**.

### 3. Run SQL Migrations

In the Supabase Dashboard, go to **SQL Editor** and run these migration files in order:

```
supabase/migrations/001_create_personas.sql
supabase/migrations/002_create_documents.sql
supabase/migrations/003_create_generations.sql
supabase/migrations/004_create_rls_policies.sql
supabase/migrations/005_create_storage.sql
```

Each file is self-contained. Run them one at a time and verify each succeeds before moving on.

**What each migration does:**

| File | Purpose |
|------|---------|
| `001` | Creates the `personas` table (name, org_type, persona_data JSONB) |
| `002` | Creates the `documents` table (file metadata + extracted_text) |
| `003` | Creates the `generations` table (problem, channels, generated_content JSONB) |
| `004` | Enables Row Level Security on all tables with `auth.uid() = user_id` policies |
| `005` | Creates the `user-documents` storage bucket with user-isolated access policies |

### 4. Enable OAuth Providers (Optional)

To support Google and/or GitHub login:

1. Go to **Authentication → Providers** in the Supabase Dashboard.
2. **Google**: Enable it, add your Google OAuth Client ID and Secret. Set the redirect URL to `https://your-project.supabase.co/auth/v1/callback`.
3. **GitHub**: Enable it, create a GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers). Set the callback URL to `https://your-project.supabase.co/auth/v1/callback`.

### 5. Set Up Environment Variables

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public key |
| `ANTHROPIC_API_KEY` | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |

> **Security note**: `ANTHROPIC_API_KEY` is only used server-side in API routes. It is never exposed to the browser. The two `NEXT_PUBLIC_` variables are safe to expose — the anon key is rate-limited by Supabase and protected by Row Level Security.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

### One-Click Deploy

1. Push your code to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Set the following environment variables in the Vercel dashboard:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key |

4. Click **Deploy**.

### Vercel Configuration

The included `vercel.json` sets:

- **Region**: `iad1` (US East) — change if your users are elsewhere.
- **Function timeout**: 60s for AI-powered routes (`generate-content`, `analyze-persona`).
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` on all API routes.

### Post-Deploy Checklist

- [ ] Verify the health endpoint: `https://your-app.vercel.app/api/health`
- [ ] Set up your Supabase Auth redirect URL to include your Vercel domain
- [ ] Test OAuth login (Google/GitHub) with the production URL
- [ ] Verify file upload and document parsing works
- [ ] Generate content and verify it saves to history

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (fonts, toast provider)
│   ├── error.tsx                   # Global error boundary
│   ├── not-found.tsx               # 404 page
│   ├── api/
│   │   ├── health/route.ts         # Health check
│   │   ├── personas/route.ts       # List & create personas
│   │   ├── personas/[id]/route.ts  # Get, update, delete persona
│   │   ├── documents/route.ts      # Upload & delete documents
│   │   ├── analyze-persona/route.ts# AI persona analysis
│   │   └── generate-content/route.ts# AI content generation (rate-limited)
│   ├── auth/
│   │   ├── login/page.tsx          # Email + OAuth login
│   │   ├── signup/page.tsx         # Registration
│   │   └── callback/route.ts      # OAuth redirect handler
│   └── dashboard/
│       ├── layout.tsx              # Sidebar navigation
│       ├── page.tsx                # Dashboard home (personas / onboarding)
│       ├── generate/page.tsx       # Content generator
│       ├── history/page.tsx        # Generation history
│       ├── personas/page.tsx       # Persona grid
│       ├── personas/new/page.tsx   # 5-step persona creation wizard
│       └── personas/[id]/page.tsx  # Persona detail & edit
├── components/
│   ├── layout/Navbar.tsx           # Top navigation bar
│   ├── dashboard/OnboardingFlow.tsx# New user onboarding
│   └── ui/Toast.tsx                # Toast notification system
├── hooks/
│   ├── usePersonas.ts              # Persona CRUD with optimistic updates
│   ├── useDocuments.ts             # Document upload/delete
│   └── useContentGeneration.ts     # Content generation
└── lib/
    ├── types.ts                    # TypeScript interfaces
    ├── anthropic.ts                # Claude API wrapper
    ├── document-parser.ts          # PDF/DOCX/CSV/TXT extraction
    ├── rate-limit.ts               # In-memory rate limiter
    ├── supabase/
    │   ├── client.ts               # Browser Supabase client
    │   ├── server.ts               # Server Supabase client
    │   ├── middleware.ts            # Auth session management
    │   └── storage.ts              # File upload/download/text cache
    └── prompts/
        ├── persona-builder.ts      # Persona analysis prompt
        ├── content-generator.ts    # Content generation prompt
        └── channel-specs.ts        # Channel definitions & guidelines
```

## Security

- **Authentication**: All dashboard pages and API routes require Supabase auth.
- **Row Level Security**: Every table enforces `auth.uid() = user_id`.
- **Storage Isolation**: Each user can only access files in their own folder (`user-documents/{user_id}/*`).
- **Server-only API key**: `ANTHROPIC_API_KEY` is never sent to the browser.
- **Rate Limiting**: 10 content generations per user per hour.
- **Input Validation**: All API routes validate and sanitize input (UUID format, string length, allowed values).
- **Security Headers**: API routes include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.

## License

Private — All rights reserved.
