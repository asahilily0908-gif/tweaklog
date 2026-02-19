# Tweaklog

Ad operations change-log and impact analysis SaaS. "Log the tweak. See the lift."

Records advertising changes (bid, creative, targeting, budget, structure), compares before/after KPIs with user-defined North Star metrics, and provides AI-powered analysis.

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
- **Package manager:** pnpm

## Completed Features

1. **Authentication** — Email/password login & signup, logout, middleware session refresh
2. **Setup Wizard** (4 steps) — Organization name, project + platform, North Star KPI + sub-KPIs, CSV column mapping with auto-detect
3. **Dashboard** — North Star KPI + Cost cards, custom metric cards with smart formatting (currency/percent/ratio), multi-metric line chart with tab switching, date range filter (7d/14d/30d/90d/All), platform filter (ALL/Google Ads), experiment reference lines on chart, skeleton loading state
4. **Experiments** — Log changes with category/platform/title/date/before-after/reason, list view with filters and impact scores, detail view, FAB for quick entry
5. **CSV Import** — Drag & drop upload, auto-detect column mapping (EN + JP headers), preview table, batch upsert via server action
6. **Impact Card** — Before/after 7-day KPI comparison, impact score (-4 to +4) based on North Star KPI, slide-over panel from experiment list
7. **AI Chat** — Claude API streaming, project-context-aware (experiments + outcomes + KPI config), suggested prompts on empty state
8. **Settings** — Project settings (name, org, platforms), KPI settings (North Star + sub-KPIs), custom formula editor with templates + variable chips + live preview, danger zone (delete project with confirmation)
9. **Custom Metrics** — Formula evaluator supporting `+ - * / ()` `IF` `SUM` `AVG` `MIN` `MAX`, stored in metric_configs, evaluated at render time, displayed as first-class metrics on dashboard

## Database

Supabase PostgreSQL with RLS on all tables. 4 migration files.

Key tables:
- `organizations` — org name, plan, Stripe fields
- `org_members` — user ↔ org with role (owner/operator/manager/client/viewer)
- `profiles` — user display name, avatar
- `projects` — name, platforms[], north_star_kpi, sub_kpis[]
- `experiments` — change log entries (category, platform, before/after, reason, tags, title)
- `outcomes` — daily KPI data (date, platform, campaign, impressions, clicks, cost, conversions, revenue, custom_columns JSONB)
- `metric_configs` — custom formula definitions (name, formula, improvement_direction)
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
```

## File Structure

```
app/
├── layout.tsx                          # Root layout (Toaster, global styles)
├── page.tsx                            # Landing / redirect
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── auth/callback/route.ts              # Supabase OAuth callback
├── (app)/
│   ├── layout.tsx                      # Auth guard layout
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
│       │   ├── page.tsx
│       │   └── actions.ts
│       ├── chat/page.tsx
│       └── settings/
│           ├── page.tsx
│           └── actions.ts
└── api/
    ├── ai/chat/route.ts                # Claude streaming endpoint
    └── metric-configs/preview/route.ts # Formula preview endpoint

components/
├── layout/Sidebar.tsx                  # Responsive sidebar + logout
├── setup/
│   ├── SetupWizard.tsx
│   ├── NorthStarKpiStep.tsx
│   ├── ColumnMappingStep.tsx
│   ├── MetricConfigStep.tsx
│   └── SetupCompleteStep.tsx
├── dashboard/
│   ├── DashboardContent.tsx            # Main dashboard (KPI cards, chart, experiments)
│   ├── DashboardSkeleton.tsx           # Skeleton loader
│   ├── KpiCard.tsx
│   ├── TimelineChart.tsx               # Recharts line chart
│   ├── PlatformFilter.tsx
│   ├── RecentExperiments.tsx
│   └── AiHighlights.tsx
├── experiments/
│   ├── ExperimentsContent.tsx          # List + filters + impact scores
│   └── NewChangeModal.tsx              # Create experiment modal
├── impact/
│   ├── ImpactCardPanel.tsx             # Slide-over impact comparison
│   └── ScoreBadge.tsx                  # -4 to +4 score badge
├── import/CsvImportContent.tsx         # CSV upload + mapping + import flow
├── ai/ChatInterface.tsx                # AI chat with streaming
└── settings/SettingsContent.tsx        # All settings sections

lib/
├── supabase/
│   ├── client.ts                       # Browser client (createBrowserClient)
│   ├── server.ts                       # Server client (cookies-based)
│   ├── admin.ts                        # Service role client
│   └── middleware.ts                   # Session refresh middleware
├── metrics/
│   ├── score-calculator.ts             # Impact score (-4 to +4) calculation
│   └── formula-evaluator.ts            # Custom formula parser & evaluator
└── ai/
    ├── claude-client.ts                # Anthropic SDK wrapper
    └── context-builder.ts              # Build AI context from project data

supabase/migrations/
├── 001_initial_schema.sql              # All tables, indexes, RLS policies
├── 002_fix_rls_recursion.sql           # RLS policy fixes
├── 003_add_experiment_title.sql        # Add title column to experiments
└── 004_fix_rls_final.sql              # Final RLS cleanup

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

## v2 Updates (Marketer Feedback)

### 1. Platform Customization

**Current:** Hardcoded 3 platforms (Google Ads, Meta, TikTok).
**New:** Preset + user-defined platforms.

- **Presets:** Google Ads, Meta, TikTok, Yahoo! Ads, Microsoft Ads, LINE Ads, X (Twitter) Ads
- Users can add custom platform names via "+ Add Platform" button in Settings
- DB: `projects.platform` (TEXT[]) unchanged — stores any string value
- Dashboard platform filter: dynamically generated from the project's registered platforms (no hardcoding)
- Settings page: platform management UI (add/remove/reorder)
- NewChangeModal platform dropdown: reads from project's registered platforms
- Setup wizard step 2: updated preset list + custom input option

**Files to update:**
- `components/dashboard/PlatformFilter.tsx` — generate filter buttons from project.platform[] instead of hardcoded list
- `components/dashboard/DashboardContent.tsx` — pass project.platform to PlatformFilter
- `components/experiments/NewChangeModal.tsx` — platform dropdown from project.platform[]
- `components/settings/SettingsContent.tsx` — add platform management (add custom, remove, reorder)
- `components/setup/SetupWizard.tsx` — expanded preset list + custom input
- `components/dashboard/RecentExperiments.tsx` — dynamic PLATFORM_COLORS mapping

### 2. Experiment Groups (検証グループ)

Group campaigns within a project to separate testing campaigns from steady-state campaigns.

**Use case:** Job ads company running campaigns for IT positions (testing new creatives) and Manufacturing positions (no changes, business as usual). Groups let you isolate impact analysis to only the campaigns being actively experimented on.

**Each group has:**
- `name` — e.g. "IT Positions - Creative Test"
- `status` — testing | steady | completed
- `campaign_patterns` — TEXT[] of campaign name patterns (substring match or exact)
- `note` — free text for context

**UI integration:**
- Dashboard + Experiments list: group filter dropdown
- Impact Cards: can be generated per group (only outcomes matching group's campaign patterns)
- Settings or dedicated page: group CRUD
- Experiment logging: optionally assign to a group

**New DB table:**
```sql
CREATE TABLE experiment_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'testing' CHECK (status IN ('testing','steady','completed')),
  campaign_patterns TEXT[] DEFAULT '{}',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_experiment_groups_project ON experiment_groups(project_id);
```

**RLS policy:** Same pattern as other project-scoped tables — access via org_members join.

**Files to create/update:**
- `supabase/migrations/005_experiment_groups.sql` — new table + RLS + index
- `components/dashboard/GroupFilter.tsx` — new component (dropdown filter)
- `components/settings/SettingsContent.tsx` — add group management section (or separate page)
- `components/dashboard/DashboardContent.tsx` — group filter state, filter outcomes by campaign patterns
- `components/experiments/ExperimentsContent.tsx` — group filter
- `app/(app)/app/[project]/dashboard/page.tsx` — fetch experiment_groups
- `app/(app)/app/[project]/settings/actions.ts` — CRUD actions for groups

### 3. Terminology Change: "North Star KPI" → "メインKPI / Main KPI"

**Reason:** Marketer feedback — "北極星KPI" is jargon that confuses non-technical clients. "メインKPI / Main KPI" is universally understood.

**UI changes:**
- Setup wizard (NorthStarKpiStep): heading → "Select your Main KPI", description text updated
- Dashboard (NorthStarCard → MainKpiCard): label "North Star KPI" → "Main KPI"
- Settings (SettingsContent): section title "North Star KPI" → "Main KPI"
- Impact Cards: score label "North Star KPI change" → "Main KPI change"
- All tooltips, helper text, AI prompt context

**DB column (no rename needed):** Keep `projects.north_star_kpi` and `projects.sub_kpis` column names as-is for backwards compatibility. Only change user-facing labels.

**Files to update:**
- `components/setup/NorthStarKpiStep.tsx` — UI text only
- `components/dashboard/DashboardContent.tsx` — label text
- `components/settings/SettingsContent.tsx` — section title + labels
- `components/impact/ImpactCard.tsx` — score label (when implemented)
- `lib/ai/context-builder.ts` — prompt text (when implemented)
- Any i18n keys referencing "North Star"

**Glossary:** Main KPI (メインKPI) = the single most important metric the user defines for their business. Formerly "North Star KPI". Used as: default dashboard display in ALL mode, Impact Card score basis, AI highlight detection target.

## Pending / Future

**Implementation order for v2 updates: 3 → 1 → 2**

1. **Terminology change** (v2 #3) — smallest scope, UI text only, no schema changes
2. **Platform customization** (v2 #1) — schema migration + UI updates
3. **Experiment groups** (v2 #2) — new table + new UI components + filter logic

**Other planned features:**
- Google Ads API integration (auto-import changes)
- BigQuery / Snowflake daily sync (Agency plan)
- API Export endpoints (`/api/export/experiments`, `/api/export/outcomes`)
- Google OAuth setup
- Stripe billing integration (Personal $19/Team $99/Agency $499)
- Multi-project switcher UI
- Slack `/tweaklog` command integration
- LINE Bot integration (Japan market)
- Command palette (Cmd+K)
- Client view (token-based read-only access)
- Production deployment (Vercel)
