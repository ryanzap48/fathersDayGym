# Lift — strength training tracker

A clean, minimalist fitness tracking app for strength training. Log workouts set
by set, watch your estimated 1RM climb, track body weight, set goals, and read
the story your training is telling — all in a spare, typographic interface with
**no cards, boxes, or borders**: structure comes from whitespace, type hierarchy,
and the occasional thin rule.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase +
Recharts**, ready to deploy on **Vercel**.

---

## Features

- **Auth** — email/password and Google OAuth via Supabase Auth, with protected
  routes enforced in `proxy.ts`.
- **Exercise library** — 129 seeded global exercises across every muscle group
  and equipment type, plus user-created custom exercises.
- **Workout logging** — start a session, add exercises, log sets (weight, reps,
  RPE, set type), with a built-in **rest timer**, **plate calculator**, and
  inline **"last time"** performance for progressive overload. Optimistic UI.
- **Body weight** — daily check-ins charted with a **7-day moving average**,
  goal tracking, and weekly/total change.
- **Goals** — target a body weight, an estimated 1RM on a lift, weekly training
  frequency, or weekly volume; progress is computed against your real data.
- **Analytics** — strength progression (Epley est. 1RM + top set), volume per
  workout and per week, muscle-group balance, automatic **personal records**,
  consistency (streak, workouts/week, training-calendar heatmap).
- **History** — full searchable workout history, per-exercise progression, and
  **CSV/JSON export**.

---

## Getting started

### 1. Create a Supabase project

At [supabase.com](https://supabase.com) create a project, then in the dashboard:

1. **SQL Editor → New query** → paste and run [`supabase/schema.sql`](supabase/schema.sql).
   This creates every table, enables Row Level Security with owner-scoped
   policies, and adds a trigger that creates a `profiles` row on sign-up.
2. Run [`supabase/seed.sql`](supabase/seed.sql) to load the global exercise
   library. (Regenerate it any time with `node supabase/generate-seed.mjs`.)
3. **Authentication → Providers** → enable **Email** and **Google** (add your
   Google OAuth client ID/secret). Add `http://localhost:3000/auth/callback`
   and your production callback URL to the allowed redirect URLs.

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in from **Settings → API**:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (your origin in prod) |

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> The repo ships with placeholder values in `.env.local` so `npm run build`
> works out of the box; swap in real credentials before signing in.

### 4. Deploy to Vercel

Import the repo on Vercel, add the three env vars above (set `NEXT_PUBLIC_SITE_URL`
to your deployed origin), and deploy. Add the production `/auth/callback` URL to
Supabase's allowed redirects.

---

## Project structure

```
supabase/
  schema.sql          Tables, RLS policies, indexes, profile trigger
  seed.sql            Global exercise library (generated)
  generate-seed.mjs   Seed generator

src/
  proxy.ts            Session refresh + route protection (Next 16 "proxy")
  app/
    page.tsx          Landing (redirects to /dashboard when authed)
    (auth)/           sign-in, sign-up
    (app)/            Authenticated shell + all app routes
      dashboard, workout/new, workout/[id], history,
      exercises, exercises/[id], analytics, bodyweight, goals, settings
    auth/             OAuth callback + sign-out route handlers
    export/           CSV / JSON data export
  lib/
    supabase/         Browser, server, and proxy Supabase clients
    database.types.ts Typed schema (matches schema.sql)
    queries.ts        Server-side data access (nested workout fetch, etc.)
    utils/            Pure logic: one-rep-max, volume, plate-calculator,
                      moving-average, analytics, consistency,
                      personal-records, format
  components/
    ui.tsx            Container-free building blocks (Stat, Progress, …)
    Nav, AuthForm, HistoryList, ExerciseLibrary, BodyweightTracker,
    GoalsManager, SettingsForm, AnalyticsStrength
    logger/           WorkoutLogger, ExercisePicker, RestTimer, PlateCalculator
    charts/           Recharts LineChart & BarChart, custom Heatmap, theme
```

### Architecture notes

- **Server Components fetch and display data**; Client Components are used only
  where interactivity is required (logging, charts, forms).
- **Row Level Security** is the source of truth for authorization — every query
  is automatically scoped to the signed-in user; seeded exercises (`user_id is
  null`) are readable by all.
- **Pure utilities** in `src/lib/utils` hold all calculations (Epley 1RM,
  volume, plate math, moving average, PR detection) and are framework-free.
- The estimated 1RM uses **Epley**: `1RM = weight × (1 + reps / 30)`.

### Regenerating types

After changing the schema you can regenerate `src/lib/database.types.ts` from a
live project:

```bash
npx supabase gen types typescript --project-id <your-id> > src/lib/database.types.ts
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `node supabase/generate-seed.mjs` | Regenerate the exercise seed |
