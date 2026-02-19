-- ============================================================================
-- Fix RLS infinite recursion
-- Problem: policies on org_members reference org_members itself, and every
--          other policy that subqueries org_members triggers the same recursion.
-- Solution: SECURITY DEFINER helper functions that bypass RLS.
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS (bypass RLS via SECURITY DEFINER)
-- ============================================================================

-- Returns org_ids where the current user is a member (any role)
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
$$;

-- Returns org_ids where the current user is owner or manager
CREATE OR REPLACE FUNCTION public.get_my_manageable_org_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT org_id FROM org_members
  WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
$$;

-- Returns TRUE if the org has zero members (bootstrap check)
CREATE OR REPLACE FUNCTION public.org_has_no_members(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM org_members WHERE org_id = target_org_id)
$$;

-- Returns project_ids the current user can read (member of owning org)
CREATE OR REPLACE FUNCTION public.get_my_project_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT p.id FROM projects p
  WHERE p.org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
$$;

-- Returns project_ids the current user can write (owner/manager/operator)
CREATE OR REPLACE FUNCTION public.get_my_writable_project_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT p.id FROM projects p
  JOIN org_members om ON om.org_id = p.org_id
  WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
$$;

-- ============================================================================
-- DROP ALL EXISTING POLICIES (except profiles which are fine)
-- ============================================================================

-- organizations
DROP POLICY IF EXISTS org_select ON organizations;
DROP POLICY IF EXISTS org_update ON organizations;
DROP POLICY IF EXISTS org_insert ON organizations;
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
-- RECREATE ALL POLICIES (using helper functions)
-- ============================================================================

-- Organizations
CREATE POLICY org_select ON organizations FOR SELECT
  USING (id IN (SELECT public.get_my_org_ids()));

CREATE POLICY org_insert ON organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY org_update ON organizations FOR UPDATE
  USING (id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY org_delete ON organizations FOR DELETE
  USING (id IN (SELECT public.get_my_manageable_org_ids()));

-- Org members (the table that caused recursion)
CREATE POLICY org_members_select ON org_members FOR SELECT
  USING (org_id IN (SELECT public.get_my_org_ids()));

CREATE POLICY org_members_insert ON org_members FOR INSERT
  WITH CHECK (
    -- Managers/owners can add members to their orgs
    org_id IN (SELECT public.get_my_manageable_org_ids())
    -- Bootstrap: user adding self as first member of a new org
    OR (user_id = auth.uid() AND public.org_has_no_members(org_id))
  );

CREATE POLICY org_members_update ON org_members FOR UPDATE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY org_members_delete ON org_members FOR DELETE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

-- Projects
CREATE POLICY projects_select ON projects FOR SELECT
  USING (org_id IN (SELECT public.get_my_org_ids()));

CREATE POLICY projects_insert ON projects FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_my_org_ids()));

CREATE POLICY projects_update ON projects FOR UPDATE
  USING (org_id IN (SELECT public.get_my_org_ids()));

CREATE POLICY projects_delete ON projects FOR DELETE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

-- Experiments
CREATE POLICY experiments_select ON experiments FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY experiments_insert ON experiments FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY experiments_update ON experiments FOR UPDATE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY experiments_delete ON experiments FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- Batches
CREATE POLICY batches_select ON batches FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY batches_insert ON batches FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY batches_update ON batches FOR UPDATE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY batches_delete ON batches FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- Outcomes
CREATE POLICY outcomes_select ON outcomes FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY outcomes_insert ON outcomes FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY outcomes_update ON outcomes FOR UPDATE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY outcomes_delete ON outcomes FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- Metric configs
CREATE POLICY metric_configs_select ON metric_configs FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY metric_configs_insert ON metric_configs FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY metric_configs_update ON metric_configs FOR UPDATE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY metric_configs_delete ON metric_configs FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- Impact cards
CREATE POLICY impact_cards_select ON impact_cards FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY impact_cards_insert ON impact_cards FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY impact_cards_update ON impact_cards FOR UPDATE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

CREATE POLICY impact_cards_delete ON impact_cards FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- AI chats
CREATE POLICY ai_chats_select ON ai_chats FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY ai_chats_insert ON ai_chats FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY ai_chats_update ON ai_chats FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY ai_chats_delete ON ai_chats FOR DELETE
  USING (user_id = auth.uid());

-- AI highlights
CREATE POLICY ai_highlights_select ON ai_highlights FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY ai_highlights_insert ON ai_highlights FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY ai_highlights_delete ON ai_highlights FOR DELETE
  USING (project_id IN (SELECT public.get_my_writable_project_ids()));

-- Client tokens
CREATE POLICY client_tokens_select ON client_tokens FOR SELECT
  USING (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY client_tokens_insert ON client_tokens FOR INSERT
  WITH CHECK (project_id IN (SELECT public.get_my_project_ids()));

CREATE POLICY client_tokens_delete ON client_tokens FOR DELETE
  USING (project_id IN (SELECT public.get_my_project_ids()));

-- API keys
CREATE POLICY api_keys_select ON api_keys FOR SELECT
  USING (org_id IN (SELECT public.get_my_org_ids()));

CREATE POLICY api_keys_insert ON api_keys FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY api_keys_delete ON api_keys FOR DELETE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

-- BigQuery sync configs
CREATE POLICY bigquery_sync_configs_select ON bigquery_sync_configs FOR SELECT
  USING (org_id IN (SELECT public.get_my_org_ids()));

CREATE POLICY bigquery_sync_configs_insert ON bigquery_sync_configs FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY bigquery_sync_configs_update ON bigquery_sync_configs FOR UPDATE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

CREATE POLICY bigquery_sync_configs_delete ON bigquery_sync_configs FOR DELETE
  USING (org_id IN (SELECT public.get_my_manageable_org_ids()));

-- Sync logs
CREATE POLICY sync_logs_select ON sync_logs FOR SELECT
  USING (sync_config_id IN (
    SELECT id FROM bigquery_sync_configs
    WHERE org_id IN (SELECT public.get_my_org_ids())
  ));

CREATE POLICY sync_logs_insert ON sync_logs FOR INSERT
  WITH CHECK (sync_config_id IN (
    SELECT id FROM bigquery_sync_configs
    WHERE org_id IN (SELECT public.get_my_org_ids())
  ));
