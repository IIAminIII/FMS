# Saturday Football Fund Manager

A friendly, production-ready Next.js App Router dashboard for weekly football attendance, player fees, sponsor support, expenses, dues, and the remaining club fund.

## Folder structure

```text
.
├── proxy.ts                       # Supabase session refresh + route protection
├── supabase/
│   └── schema.sql                 # Tables, checks, triggers, RLS, views, seed data
├── src/
│   ├── app/
│   │   ├── (dashboard)/           # Protected application routes
│   │   │   ├── dashboard/
│   │   │   ├── matches/[id]/
│   │   │   ├── players/
│   │   │   ├── contributions/
│   │   │   ├── expenses/
│   │   │   ├── due-list/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── login/                 # Email/password sign-in
│   │   ├── globals.css            # Tailwind tokens and sporty theme
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                    # Owned shadcn-style primitives
│   │   ├── providers/             # Supabase/demo data state
│   │   ├── app-shell.tsx          # Sidebar, header, mobile navigation
│   │   └── entity-dialogs.tsx     # Zod + React Hook Form quick actions
│   └── lib/
│       ├── supabase/              # Browser, server, and Proxy clients
│       ├── calculations.ts        # All derived financial logic
│       ├── schemas.ts             # Form validation
│       ├── seed.ts                # Local product-tour data
│       └── types.ts               # Domain records
├── .env.example
└── package.json
```

## Database schema

The complete SQL is in [`supabase/schema.sql`](supabase/schema.sql). It includes:

- `players`, `matches`, `attendance`, `contributions`, `expenses`, and `settings`
- strict status/type checks and useful indexes
- automatic attendance payment-status calculation
- automatic attendance paid-amount syncing when contributions change
- an editable default turf-fee expense for every new match
- `match_summary_view`, `player_balance_view`, and `overall_balance_view`
- Row Level Security: authenticated users have club access; anonymous users have none
- the requested sample players, next-Saturday match, contributions, and expense

Balances are never stored or manually editable. They are always calculated as `contributions - expenses`.

## Local setup

1. Install Node.js 20.9 or newer.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env.local`.

4. For an immediate product tour, set `NEXT_PUBLIC_DEMO_MODE=true`. Demo edits persist in browser local storage.
5. Start the app:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`. Without configured Supabase credentials, the sign-in page clearly offers demo access.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it once.
3. Open **Authentication → Providers → Email** and enable email/password authentication.
4. Open **Authentication → Users** and create the first fund-manager user.
5. In **Project Settings → API**, copy the project URL and publishable key into `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   NEXT_PUBLIC_DEMO_MODE=false
   ```

6. Restart `npm run dev`, then sign in with the user created in step 4.

## Pages and workflows

- **Dashboard:** next/last match, balance, monthly totals, dues, sponsor support, and recent activity.
- **Players:** add/edit/deactivate, payment totals, current due, and extra support.
- **Matches:** create/edit/cancel/complete and open the complete match book.
- **Match detail:** attendance, contribution, expense, derived summary, and printable view.
- **Contributions / Expenses:** separate ledgers with add/edit/delete and filters.
- **Due list:** filter outstanding fees and record payment with one click.
- **Reports:** monthly collection/expense, player contribution, sponsor, match history, and CSV export.
- **Settings:** reusable turf, time, and fee defaults.

## Vercel deployment

1. Push the project to a Git repository.
2. Import the repository in Vercel; the framework preset should resolve to **Next.js**.
3. Add the three environment variables shown above to Production, Preview, and Development.
4. Keep `NEXT_PUBLIC_DEMO_MODE=false` in shared deployments.
5. Deploy. No custom build command is needed (`next build` is detected automatically).
6. Add the production domain to **Supabase → Authentication → URL Configuration** as the Site URL.

Before deploying, run:

```bash
npm run typecheck
npm run lint
npm run build
```
