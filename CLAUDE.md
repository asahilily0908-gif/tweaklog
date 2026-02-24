# Tweaklog

Ad operations change-log and impact analysis SaaS. "Log the tweak. See the lift."

Records advertising changes (bid, creative, targeting, budget, structure), compares before/after KPIs with user-defined Main KPI metrics, and provides AI-powered analysis.

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router, Server Components, Server Actions)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS v4 + PostCSS
- **Database:** Supabase (PostgreSQL, RLS, Auth) — Tokyo region
- **Auth:** @supabase/ssr with middleware-based session management
- **Charts:** Recharts 3.7
- **AI:** Anthropic Claude API (@anthropic-ai/sdk)
- **Toasts:** sonner
- **Animations:** framer-motion 12 + CSS keyframes
- **i18n:** Custom locale provider (Japanese default, English supported)
- **Package manager:** pnpm
- **Deployment:** Vercel (https://tweaklog.vercel.app)

## Completed Features

1. **Authentication** — Email/password login & signup, logout, middleware session refresh, post-login redirect (existing users → dashboard, new users → setup wizard)
2. **Setup Wizard** (4 steps) — Organization name, project + platform (7 presets + custom), Main KPI + sub-KPIs, CSV column mapping with auto-detect
3. **Dashboard** — Main KPI + Cost cards, custom metric cards with smart formatting (currency/percent/ratio), multi-metric line chart with tab switching (CPA & Cost / Profit / CTR), date range filter (7d/14d/30d/90d/All), dynamic platform filter, experiment marker dots on chart (colored by category, hover tooltip, click to open Impact Card), skeleton loading state
4. **Experiments** — Log changes with category/platform/title/date/before-after/reason, list view with filters and impact scores, detail view, FAB for quick entry, experiment group assignment
5. **Data Import** — Tabbed UI: CSV Upload (drag & drop, auto-detect column mapping) | Google Spreadsheet (URL input, header row auto-detection, data range selector, column mapping, saved config, one-click resync). Shared column-mappings.ts with 40+ JP/EN patterns (Google Ads, Yahoo! Ads). Batch upsert via server action
6. **Impact Card** — Before/after 7-day KPI comparison, impact score (-4 to +4) based on Main KPI, slide-over panel from experiment list
7. **AI Chat** — Claude API streaming, project-context-aware (experiments + outcomes + KPI config), suggested prompts on empty state
8. **Settings** — Project settings (name, org), platform management (7 presets + custom add/remove), KPI settings (Main KPI + sub-KPIs), custom formula editor with templates + variable chips + live preview, experiment group management (CRUD, searchable picker), danger zone (delete project with confirmation)
9. **Custom Metrics** — Formula evaluator supporting `+ - * / ()` `IF` `SUM` `AVG` `MIN` `MAX`, stored in metric_configs, evaluated at render time, displayed as first-class metrics on dashboard with chart tab switching
10. **Experiment Groups** (検証グループ) — Campaign grouping by name patterns (testing/steady/completed status), searchable picker UI, dashboard + experiment list group filter
11. **i18n** (Japanese/English) — 16 components translated, 200+ translation keys, language switcher in sidebar and auth pages, default locale: Japanese
12. **Stripe Billing** — Checkout sessions (Pro $19/Team $99), webhook handler (checkout.completed, subscription updates), Customer Portal, BillingSection in settings, LP pricing CTAs with auth detection
13. **Landing Page** — Full marketing LP with hero, pain points, features, pricing, FAQ, CTA sections. Mobile responsive. Auth-aware (logged-in users see Dashboard link, pricing CTAs go to Stripe Checkout)
14. **SEO / OGP** — Dynamic OG image (1200x630, code-generated), Twitter Card, dynamic favicon & Apple Touch Icon, rich metadata (keywords, robots, locale)

## Database

Supabase PostgreSQL with RLS on all tables. 6 migration files.

Key tables:
- `organizations` — org name, plan, Stripe fields
- `org_members` — user ↔ org with role (owner/operator/manager/client/viewer)
- `profiles` — user display name, avatar
- `projects` — name, platforms[], north_star_kpi, sub_kpis[]
- `experiments` — change log entries (category, platform, before/after, reason, tags, title)
- `outcomes` — daily KPI data (date, platform, campaign, impressions, clicks, cost, conversions, revenue, custom_columns JSONB)
- `metric_configs` — custom formula definitions (name, formula, improvement_direction)
- `experiment_groups` — campaign grouping (name, status, campaign_patterns[], note)
- `spreadsheet_configs` — Google Spreadsheet import configs (url, gid, header_row, column_mappings JSONB, last_synced_at)
- `ai_chats` — chat history (messages JSONB)
- `ai_highlights` — auto-detected KPI anomalies
- `impact_cards` — saved before/after comparisons
- `batches` — grouped experiment changes

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```

## File Structure

```
app/
├── layout.tsx                          # Root layout (metadata, OGP, Toaster, LocaleProvider)
├── page.tsx                            # Landing page (LP) with pricing CTAs
├── opengraph-image.tsx                 # Dynamic OG image generation (1200x630)
├── twitter-image.tsx                   # Twitter Card image (re-exports OG)
├── icon.tsx                            # Dynamic favicon (32x32)
├── apple-icon.tsx                      # Apple Touch Icon (180x180)
├── (auth)/
│   ├── layout.tsx                      # Auth pages layout (language switcher)
│   ├── login/page.tsx
│   └── signup/page.tsx
├── auth/callback/route.ts              # Supabase OAuth callback
├── (app)/
│   ├── layout.tsx                      # Auth guard layout
│   ├── post-login/page.tsx             # Post-login router (existing→dashboard, new→setup)
│   ├── setup/
│   │   ├── page.tsx                    # Setup wizard page
│   │   └── actions.ts                  # Setup server actions
│   └── app/[project]/
│       ├── layout.tsx                  # Project layout (Sidebar + user fetch)
│       ├── dashboard/page.tsx          # Dashboard (Suspense + skeleton)
│       ├── experiments/
│       │   ├── page.tsx
│       │   ├── actions.ts
│       │   └── [id]/page.tsx           # Experiment detail
│       ├── import/
│       │   ├── page.tsx                # Import page (fetches spreadsheet config)
│       │   └── actions.ts              # Import + spreadsheet config actions
│       ├── chat/page.tsx
│       └── settings/
│           ├── page.tsx
│           └── actions.ts
└── api/
    ├── ai/chat/route.ts                # Claude streaming endpoint
    ├── metric-configs/preview/route.ts  # Formula preview endpoint
    ├── spreadsheet/fetch/route.ts       # Google Sheets CSV export fetch
    └── stripe/
        ├── checkout/route.ts            # Stripe Checkout session creation
        ├── portal/route.ts              # Stripe Customer Portal redirect
        └── webhook/route.ts             # Stripe webhook handler

components/
├── layout/Sidebar.tsx                  # Responsive sidebar + logout + language switcher
├── setup/
│   ├── SetupWizard.tsx
│   ├── NorthStarKpiStep.tsx            # "Main KPI" selection (renamed from North Star)
│   ├── ColumnMappingStep.tsx           # Uses shared column-mappings.ts
│   ├── MetricConfigStep.tsx
│   └── SetupCompleteStep.tsx
├── dashboard/
│   ├── DashboardContent.tsx            # Main dashboard (KPI cards, chart, experiments)
│   ├── DashboardSkeleton.tsx           # Skeleton loader
│   ├── KpiCard.tsx
│   ├── TimelineChart.tsx               # Recharts line chart with experiment markers
│   ├── PlatformFilter.tsx              # Dynamic platform filter from project.platform[]
│   ├── RecentExperiments.tsx
│   └── AiHighlights.tsx
├── experiments/
│   ├── ExperimentsContent.tsx          # List + filters + impact scores + group filter
│   └── NewChangeModal.tsx              # Create experiment modal
├── impact/
│   ├── ImpactCardPanel.tsx             # Slide-over impact comparison
│   └── ScoreBadge.tsx                  # -4 to +4 score badge
├── import/
│   ├── ImportTabs.tsx                  # Tab switcher: CSV Upload | Google Spreadsheet
│   ├── CsvImportContent.tsx            # CSV upload + mapping + import flow
│   └── SpreadsheetImport.tsx           # Spreadsheet URL input, header detection, mapping, resync
├── ai/ChatInterface.tsx                # AI chat with streaming
├── settings/
│   ├── SettingsContent.tsx             # All settings sections (platform mgmt, groups, KPIs)
│   └── BillingSection.tsx              # Plan/billing management (Stripe portal link)

lib/
├── supabase/
│   ├── client.ts                       # Browser client (createBrowserClient)
│   ├── server.ts                       # Server client (cookies-based)
│   ├── admin.ts                        # Service role client
│   └── middleware.ts                   # Session refresh middleware
├── metrics/
│   ├── score-calculator.ts             # Impact score (-4 to +4) calculation
│   └── formula-evaluator.ts            # Custom formula parser & evaluator
├── import/
│   └── column-mappings.ts              # Shared EN+JP column name → field mappings (40+ patterns)
├── i18n/
│   ├── config.tsx                      # LocaleProvider + useTranslation hook
│   ├── en.json                         # English translations (200+ keys)
│   └── ja.json                         # Japanese translations (200+ keys)
├── stripe/
│   └── config.ts                       # Stripe client, PLANS config (price IDs, features)
└── ai/
    ├── claude-client.ts                # Anthropic SDK wrapper
    └── context-builder.ts              # Build AI context from project data

supabase/migrations/
├── 001_initial_schema.sql              # All tables, indexes, RLS policies
├── 002_fix_rls_recursion.sql           # RLS policy fixes
├── 003_add_experiment_title.sql        # Add title column to experiments
├── 004_fix_rls_final.sql               # Final RLS cleanup
├── 005_experiment_groups.sql           # Experiment groups table + RLS
└── 006_spreadsheet_configs.sql         # Spreadsheet import configs table

middleware.ts                           # Supabase session refresh on all routes
```

## Conventions

- Server Components for data fetching, Client Components (`'use client'`) for interactivity
- Server Actions in co-located `actions.ts` files for mutations
- Supabase RLS enforces data isolation — no manual auth checks needed in queries
- Toast notifications via `sonner` for all user-facing actions
- All pages use `animate-fade-in-up` CSS class for page transitions
- Number formatting: currency (`$1,234`), percent (`3.0%`), ratio (`4.2x`), plain (`12,345`)
- Responsive: sidebar collapses to hamburger on mobile (`md:` breakpoint)
- All UI text uses `t()` translation function from `useTranslation()` hook
- Column name mappings shared via `lib/import/column-mappings.ts` (single source of truth)

## Glossary

- **Main KPI** (メインKPI) = the single most important metric the user defines for their business. Formerly "North Star KPI". DB column kept as `north_star_kpi` for backwards compatibility. Used as: default dashboard display in ALL mode, Impact Card score basis, AI highlight detection target.
- **Experiment Group** (検証グループ) = campaign grouping to separate testing vs steady-state campaigns. Filters outcomes by campaign name pattern matching.

## Pending / Future

**Other planned features:**
- Google Ads API integration (auto-import changes)
- BigQuery / Snowflake daily sync (Agency plan)
- API Export endpoints (`/api/export/experiments`, `/api/export/outcomes`)
- Google OAuth setup
- Stripe billing full flow (subscription lifecycle, plan enforcement, usage limits)
- Multi-project switcher UI
- Slack `/tweaklog` command integration
- LINE Bot integration (Japan market)
- Command palette (Cmd+K)
- Client view (token-based read-only access)
- Auto-sync for Google Spreadsheet (daily/weekly cron)
- Private Google Spreadsheet support (OAuth or service account)

## Recent Changes Log

### 2026-02-20 Updates

1. **Google Spreadsheet Integration**
   - New `SpreadsheetImport` component with URL input, auto header row detection (scans first 10 rows), data range selector
   - Shared `lib/import/column-mappings.ts` with 40+ Japanese/English column name patterns (Google Ads, Yahoo! Ads)
   - `spreadsheet_configs` table for saving import configurations per project
   - One-click resync with saved mappings (restores header row, column range, field mappings)
   - Import page now has tabs: CSV Upload | Google Spreadsheet
   - API route `app/api/spreadsheet/fetch/route.ts` fetches public sheets via CSV export URL

2. **Enhanced CSV Import**
   - Japanese column name auto-detection (表示回数→Impressions, 費用→Cost, コンバージョン→Conversions, etc.)
   - `CsvImportContent` and `ColumnMappingStep` refactored to use shared `column-mappings.ts`
   - Eliminated duplicate mapping constants across 3 files

3. **Timeline Chart Experiment Markers**
   - Colored dots by category (blue=bid, purple=creative, orange=targeting, green=budget, gray=structure)
   - Hover tooltip showing date, category, title, before→after, user email, impact score
   - Click to open Impact Card panel

4. **Vercel Deployment**
   - Production URL: https://tweaklog.vercel.app
   - Root page redirects to /login
   - Post-login redirect: existing users → dashboard, new users → setup wizard

5. **i18n Complete (Japanese/English)**
   - 16 components translated, 200+ translation keys
   - Language switcher in sidebar and auth pages
   - Default locale: Japanese

6. **UI/UX Improvements**
   - Blue brand redesign (Linear/Vercel inspired)
   - Number formatting (CTR→3.2%, Profit→$3,603)
   - Mobile responsive fixes across all pages
   - Logout button added to sidebar
   - Input text visibility fixed (dark text on light bg)

7. **Marketer Feedback Implementation**
   - Terminology: "North Star KPI" → "メインKPI / Main KPI" (all UI labels updated, DB columns unchanged)
   - Platform customization: 7 presets (Google Ads, Meta, TikTok, Yahoo! Ads, Microsoft Ads, LINE Ads, X Ads) + user-defined custom platforms
   - Experiment Groups: campaign grouping with searchable picker UI, testing/steady/completed status, campaign pattern matching

8. **Custom Metrics on Dashboard**
   - Custom formula cards (Profit, CTR, etc.) displayed as first-class metrics on dashboard
   - Chart tab switching (CPA & Cost / Profit / CTR)
   - Smart number formatting per metric type

### 2026-02-24 Updates

1. **Stripe Integration**
   - `lib/stripe/config.ts` — Stripe client + PLANS config (Pro $19/mo, Team $99/mo)
   - `app/api/stripe/checkout/route.ts` — Creates Checkout sessions, resolves priceId from plan name
   - `app/api/stripe/webhook/route.ts` — Handles checkout.completed, subscription.updated/deleted
   - `app/api/stripe/portal/route.ts` — Redirects to Stripe Customer Portal
   - `components/settings/BillingSection.tsx` — Current plan display, upgrade cards, portal link
   - `subscriptions` table in Supabase for subscription tracking

2. **Landing Page**
   - Full marketing LP at `/` with hero, pain points, features, pricing, FAQ, CTA
   - Auth-aware: logged-in users see Dashboard nav link, pricing CTAs trigger Stripe Checkout
   - Middleware updated to allow authenticated users on `/`

3. **SEO / OGP / Favicon**
   - `app/layout.tsx` — Rich metadata (OGP, Twitter Card, keywords, robots, metadataBase)
   - `app/opengraph-image.tsx` — Dynamic OG image (1200x630) with brand gradient + tagline
   - `app/twitter-image.tsx` — Twitter Card image (re-exports OG)
   - `app/icon.tsx` — Dynamic favicon (32x32, blue-purple gradient "T")
   - `app/apple-icon.tsx` — Apple Touch Icon (180x180)
   - `html lang` changed from `en` to `ja`

4. **Mobile Responsive Fixes**
   - Viewport `maximumScale: 1` to prevent zoom issues
   - LP: responsive font sizes, grid layouts, spacing, mockup scaling, pricing card ordering
   - KpiCard: smaller padding/fonts on mobile, badges hidden, value truncation
   - PlatformFilter: overflow-x-auto, smaller buttons, whitespace-nowrap
   - DashboardContent: responsive grid gaps for KPI cards
