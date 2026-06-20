<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Lift — project conventions

- **Stack:** Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4
  (CSS-based config in `src/app/globals.css`, no `tailwind.config`) + Supabase
  (`@supabase/ssr`) + Recharts.
- **Design law:** no cards, boxes, or borders. Separate content with whitespace,
  type hierarchy, and at most thin 1px dividers. Numbers are the heroes — render
  key metrics large, use `.tnum` for tabular figures. Reusable class helpers
  (`.btn`, `.field`, `.cell-input`, `.divider`) live in `globals.css`.
- **Data:** Server Components fetch via `lib/supabase/server`; interactive pieces
  use `lib/supabase/client`. Authorization is enforced by Postgres RLS, not in
  app code. Session refresh + route guarding happen in `src/proxy.ts`.
- **Types:** `src/lib/database.types.ts` is hand-kept in sync with
  `supabase/schema.sql`. Each table needs a `Relationships: []` member or the
  Supabase client resolves to `never`.
- **Calculations** live as pure functions in `src/lib/utils/` — keep them
  framework-free and unit-testable. Epley for 1RM.
- Verify changes with `npx tsc --noEmit` and `npm run build`.
