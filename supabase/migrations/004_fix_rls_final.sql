-- ============================================================================
-- 004_fix_rls_final.sql
-- Re-enable RLS on all tables and create clean policies using
-- SECURITY DEFINER helper functions (from 002) to avoid recursion.
--
-- Setup wizard flow verified:
--   1. INSERT organizations  → WITH CHECK (true)
--   2. INSERT org_members    → bootstrap: org_has_no_members() check
--   3. INSERT projects       → org_id IN get_my_writable_org_ids()
--   4. INSERT metric_configs → project_id IN get_my_writable_project_ids()
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: RE-ENABLE RLS ON ALL TABLES
-- (idempotent — safe to run even if already enabled)
-- ============================================================================

ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects               ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches                ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_configs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_cards           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_highlights          ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tokens          ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigquery_sync_configs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs              ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- (covers policy names from both 001 and 002 migrations)
-- ============================================================================

-- profiles
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;

-- organizations
DROP POLICY IF EXISTS org_select ON organizations;
DROP POLICY IF EXISTS org_insert ON organizations;
DROP POLICY IF EXISTS org_update ON organizations;
DROP POLICY IF EXISTS org_delete ON organizations;

-- org_members
DROP POLICY IF EXISTS org_members_select ON org_members;
DROP POLICY IF EXISTS org_members_insert ON org_members;
DROP POLICY IF EXISTS org_members_update ON org_members;
DROP POLICY IF EXISTS org_members_delete ON org_members;

-- projects
DROP POLICY IF EXISTS projects_select ON projects;
DROP POLICY IF EXISTS projects_insert ON projects;
DROP POLICY IF EXISTS projects_update ON projects;
DROP POLICY IF EXISTS projects_delete ON projects;

-- experiments
DROP POLICY IF EXISTS experiments_select ON experiments;
DROP POLICY IF EXISTS experiments_insert ON experiments;
DROP POLICY IF EXISTS experiments_update ON experiments;
DROP POLICY IF EXISTS experiments_delete ON experiments;

-- batches
DROP POLICY IF EXISTS batches_select ON batches;
DROP POLICY IF EXISTS batches_insert ON batches;
DROP POLICY IF EXISTS batches_update ON batches;
DROP POLICY IF EXISTS batches_delete ON batches;

-- outcomes
DROP POLICY IF EXISTS outcomes_select ON outcomes;
DROP POLICY IF EXISTS outcomes_insert ON outcomes;
DROP POLICY IF EXISTS outcomes_update ON outcomes;
DROP POLICY IF EXISTS outcomes_delete ON outcomes;

-- metric_configs
DROP POLICY IF EXISTS metric_configs_select ON metric_configs;
DROP POLICY IF EXISTS metric_configs_insert ON metric_configs;
DROP POLICY IF EXISTS metric_configs_update ON metric_configs;
DROP POLICY IF EXISTS metric_configs_delete ON metric_configs;

-- impact_cards
DROP POLICY IF EXISTS impact_cards_select ON impact_cards;
DROP POLICY IF EXISTS impact_cards_insert ON impact_cards;
DROP POLICY IF EXISTS impact_cards_update ON impact_cards;
DROP POLICY IF EXISTS impact_cards_delete ON impact_cards;

-- ai_chats
DROP POLICY IF EXISTS ai_chats_select ON ai_chats;
DROP POLICY IF EXISTS ai_chats_insert ON ai_chats;
DROP POLICY IF EXISTS ai_chats_update ON ai_chats;
DROP POLICY IF EXISTS ai_chats_delete ON ai_chats;

-- ai_highlights
DROP POLICY IF EXISTS ai_highlights_select ON ai_highlights;
DROP POLICY IF EXISTS ai_highlights_insert ON ai_highlights;
DROP POLICY IF EXISTS ai_highlights_delete ON ai_highlights;

-- client_tokens
DROP POLICY IF EXISTS client_tokens_select ON client_tokens;
DROP POLICY IF EXISTS client_tokens_insert ON client_tokens;
DROP POLICY IF EXISTS client_tokens_delete ON client_tokens;

-- api_keys
DROP POLICY IF EXISTS api_keys_select ON api_keys;
DROP POLICY IF EXISTS api_keys_insert ON api_keys;
DROP POLICY IF EXISTS api_keys_delete ON api_keys;

-- bigquery_sync_configs
DROP POLICY IF EXISTS bigquery_sync_configs_select ON bigquery_sync_configs;
DROP POLICY IF EXISTS bigquery_sync_configs_insert ON bigquery_sync_configs;
DROP POLICY IF EXISTS bigquery_sync_configs_update ON bigquery_sync_configs;
DROP POLICY IF EXISTS bigquery_sync_configs_delete ON bigquery_sync_configs;

-- sync_logs
DROP POLICY IF EXISTS sync_logs_select ON sync_logs;
DROP POLICY IF EXISTS sync_logs_insert ON sync_logs;

-- ============================================================================
-- STEP 3: CREATE / REPLACE HELPER FUNCTIONS
-- All SECURITY DEFINER so they bypass RLS on org_members/projects.
-- The 5 existing functions from 002 are re-created here for completeness;
-- 3 new functions are added.
-- ============================================================================

-- 1. Org IDs where the current user is any member
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
$$;

-- 2. Org IDs where the current user is owner or manager
CREATE OR REPLACE FUNCTION public.get_my_manageable_org_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT org_id FROM org_members
  WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
$$;

-- 3. Org IDs where the current user is owner, manager, or operator
--    Used for project INSERT/UPDATE (operators can create/modify projects)
CREATE OR REPLACE FUNCTION public.get_my_writable_org_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT org_id FROM org_members
  WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'operator')
$$;

-- 4. TRUE if the org has zero members (bootstrap: first user adding themselves)
CREATE OR REPLACE FUNCTION public.org_has_no_members(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM org_members WHERE org_id = target_org_id)
$$;

-- 5. Project IDs readable by the current user (member of owning org)
CREATE OR REPLACE FUNCTION public.get_my_project_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT p.id FROM projects p
  WHERE p.org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
$$;

-- 6. Project IDs writable by the current user (owner/manager/operator)
CREATE OR REPLACE FUNCTION public.get_my_writable_project_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT p.id FROM projects p
  JOIN org_members om ON om.org_id = p.org_id
  WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
$$;

-- 7. Project IDs manageable by the current user (owner/manager only)
--    Used for client_tokens where only managers+ should manage
CREATE OR REPLACE FUNCTION public.get_my_manageable_project_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT p.id FROM projects p
  JOIN org_members om ON om.org_id = p.org_id
  WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager')
$$;

-- 8. Sync config IDs accessible by the current user
--    Bypasses RLS on bigquery_sync_configs to avoid nested evaluation
CREATE OR REPLACE FUNCTION public.get_my_sync_config_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT bsc.id FROM bigquery_sync_configs bsc
  WHERE bsc.org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
$$;

-- ============================================================================
-- STEP 4: CREATE POLICIES
-- ============================================================================

-- --------------------------------------------------------------------------
-- PROFILES
-- Users can only see/create/update their own profile.
-- The handle_new_user() trigger (SECURITY DEFINER) auto-creates the row.
-- --------------------------------------------------------------------------
CREATE POLICY profiles_select_own ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY profiles_insert_own ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (id = auth.uid());

-- --------------------------------------------------------------------------
-- ORGANIZATIONS
-- Any authenticated user can CREATE an org.
-- Members can READ their orgs.
-- Owner/manager can UPDATE/DELETE.
-- --------------------------------------------------------------------------
CREATE POLICY org_select ON organizations FOR SELECT
  USING (id IN (SELECT public.get_my_org_ids()));

CREATE POLICY org_insert ON organizations FOR INSERT
  WITH CHECK (true);  -- any authenticated user can create an org

CREATE POLICY org_update ON organizations FOR UPDATE
  USING (id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY org_delete ON organizations FOR DELETE
  USING (id IN (SELECT public.get_my_manageable_org_ids()));

-- --------------------------------------------------------------------------
-- ORG_MEMBERS
-- Members can READ the member list of their orgs.
-- Owner/manager can add/change/remove members.
-- Bootstrap exception: a user can add THEMSELVES as the first member of
-- a brand-new org (org_has_no_members returns true).
-- --------------------------------------------------------------------------
CREATE POLICY org_members_select ON org_members FOR SELECT
  USING (org_id IN (SELECT public.get_my_org_ids()));

CREATE POLICY org_members_insert ON org_members FOR INSERT
  WITH CHECK (
    org_id IN (SELECT public.get_my_manageable_org_ids())
    OR (user_id = auth.uid() AND public.org_has_no_members(org_id))
  );

CREATE POLICY org_members_update ON org_members FOR UPDATE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY org_members_delete ON org_members FOR DELETE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

-- --------------------------------------------------------------------------
-- PROJECTS
-- Members can READ projects in their orgs.
-- Owner/manager/operator can CREATE and UPDATE projects.
-- Only owner/manager can DELETE.
-- --------------------------------------------------------------------------
CREATE POLICY projects_select ON projects FOR SELECT
  USING (org_id IN (SELECT public.get_my_org_ids()));

CREATE POLICY projects_insert ON projects FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_my_writable_org_ids()));

CREATE POLICY projects_update ON projects FOR UPDATE
  USING (org_id IN (SELECT public.get_my_writable_org_ids()));

CREATE POLICY projects_delete ON projects FOR DELETE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

-- --------------------------------------------------------------------------
-- EXPERIMENTS
-- Project members can READ.
-- Owner/manager/operator can CREATE/UPDATE/DELETE.
-- --------------------------------------------------------------------------
CREATE POLICY experiments_select ON experiments FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY experiments_insert ON experiments FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY experiments_update ON experiments FOR UPDATE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY experiments_delete ON experiments FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- --------------------------------------------------------------------------
-- BATCHES
-- Same access pattern as experiments.
-- --------------------------------------------------------------------------
CREATE POLICY batches_select ON batches FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY batches_insert ON batches FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY batches_update ON batches FOR UPDATE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY batches_delete ON batches FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- --------------------------------------------------------------------------
-- OUTCOMES
-- Same access pattern as experiments.
-- Note: importOutcomes uses UPSERT which requires both INSERT and UPDATE.
-- --------------------------------------------------------------------------
CREATE POLICY outcomes_select ON outcomes FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY outcomes_insert ON outcomes FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY outcomes_update ON outcomes FOR UPDATE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY outcomes_delete ON outcomes FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- --------------------------------------------------------------------------
-- METRIC_CONFIGS
-- Same access pattern as experiments.
-- --------------------------------------------------------------------------
CREATE POLICY metric_configs_select ON metric_configs FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY metric_configs_insert ON metric_configs FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY metric_configs_update ON metric_configs FOR UPDATE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY metric_configs_delete ON metric_configs FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- --------------------------------------------------------------------------
-- IMPACT_CARDS
-- Project members can READ.
-- Owner/manager/operator can CREATE/UPDATE/DELETE.
-- --------------------------------------------------------------------------
CREATE POLICY impact_cards_select ON impact_cards FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY impact_cards_insert ON impact_cards FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY impact_cards_update ON impact_cards FOR UPDATE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY impact_cards_delete ON impact_cards FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- --------------------------------------------------------------------------
-- AI_CHATS
-- Project members can READ all chats in their projects.
-- Users can only INSERT chats as themselves (user_id = auth.uid()).
-- Users can only UPDATE/DELETE their own chats.
-- --------------------------------------------------------------------------
CREATE POLICY ai_chats_select ON ai_chats FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY ai_chats_insert ON ai_chats FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND project_id IN (SELECT public.get_my_project_ids())
  );

CREATE POLICY ai_chats_update ON ai_chats FOR UPDATE
  USING (
    user_id = auth.uid()
    AND project_id IN (SELECT public.get_my_project_ids())
  );

CREATE POLICY ai_chats_delete ON ai_chats FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- AI_HIGHLIGHTS
-- Project members can READ.
-- Members can INSERT (needed for batch jobs running as user context).
-- Owner/manager/operator can DELETE.
-- --------------------------------------------------------------------------
CREATE POLICY ai_highlights_select ON ai_highlights FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY ai_highlights_insert ON ai_highlights FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY ai_highlights_delete ON ai_highlights FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- --------------------------------------------------------------------------
-- CLIENT_TOKENS
-- Project members can READ tokens.
-- Only owner/manager can CREATE/DELETE tokens.
-- --------------------------------------------------------------------------
CREATE POLICY client_tokens_select ON client_tokens FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY client_tokens_insert ON client_tokens FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_manageable_project_ids()));

CREATE POLICY client_tokens_delete ON client_tokens FOR DELETE
  USING (project_id IN (SELECT public.get_my_manageable_project_ids()));

-- --------------------------------------------------------------------------
-- API_KEYS
-- Org members can READ keys.
-- Only owner/manager can CREATE/DELETE keys.
-- --------------------------------------------------------------------------
CREATE POLICY api_keys_select ON api_keys FOR SELECT
  USING (org_id IN (SELECT public.get_my_org_ids()));

CREATE POLICY api_keys_insert ON api_keys FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY api_keys_delete ON api_keys FOR DELETE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

-- --------------------------------------------------------------------------
-- BIGQUERY_SYNC_CONFIGS
-- Org members can READ configs.
-- Only owner/manager can CREATE/UPDATE/DELETE configs.
-- --------------------------------------------------------------------------
CREATE POLICY bigquery_sync_configs_select ON bigquery_sync_configs FOR SELECT
  USING (org_id IN (SELECT public.get_my_org_ids()));

CREATE POLICY bigquery_sync_configs_insert ON bigquery_sync_configs FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY bigquery_sync_configs_update ON bigquery_sync_configs FOR UPDATE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY bigquery_sync_configs_delete ON bigquery_sync_configs FOR DELETE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

-- --------------------------------------------------------------------------
-- SYNC_LOGS
-- Accessible via parent sync config's org membership.
-- Uses get_my_sync_config_ids() to avoid nested RLS evaluation.
-- --------------------------------------------------------------------------
CREATE POLICY sync_logs_select ON sync_logs FOR SELECT
  USING (sync_config_id IN (SELECT public.get_my_sync_config_ids()));

CREATE POLICY sync_logs_insert ON sync_logs FOR INSERT
  WITH CHECK (sync_config_id IN (SELECT public.get_my_sync_config_ids()));

COMMIT;
