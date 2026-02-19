-- ============================================================================
-- Tweaklog Initial Schema Migration
-- Version: 001
-- Description: Creates all core tables, indexes, and Row Level Security policies
-- ============================================================================

-- ============================================================================
-- TABLE DEFINITIONS
-- ============================================================================

-- Profiles table (extends auth.users)
-- Note: This references the existing auth.users table from Supabase Auth
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','personal','team','agency')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organization members table (junction table for many-to-many)
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('owner','operator','manager','client','viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT[] DEFAULT '{}',
  north_star_kpi TEXT,
  sub_kpis TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Experiments table (change log)
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  batch_id UUID,
  category TEXT NOT NULL CHECK (category IN ('bid','creative','targeting','budget','structure')),
  platform TEXT NOT NULL,
  campaign TEXT,
  before_value TEXT,
  after_value TEXT,
  reason TEXT,
  internal_note TEXT,
  client_note TEXT,
  tags TEXT[] DEFAULT '{}',
  is_ai_highlighted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Batches table (groups of experiments)
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  experiment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Outcomes table (KPI data)
CREATE TABLE outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  campaign TEXT,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  custom_columns JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, date, platform, campaign)
);

-- Metric configs table (custom formulas)
CREATE TABLE metric_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  formula TEXT NOT NULL,
  improvement_direction TEXT NOT NULL DEFAULT 'up' CHECK (improvement_direction IN ('up','down')),
  is_template BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, name)
);

-- Impact cards table (before/after analysis)
CREATE TABLE impact_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES experiments(id),
  batch_id UUID REFERENCES batches(id),
  before_start DATE NOT NULL,
  before_end DATE NOT NULL,
  after_start DATE NOT NULL,
  after_end DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  score INTEGER CHECK (score >= -4 AND score <= 4),
  north_star_change_pct NUMERIC(8,4),
  ai_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI chats table
CREATE TABLE ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI highlights table
CREATE TABLE ai_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  change_pct NUMERIC(8,4),
  related_experiment_ids UUID[] DEFAULT '{}',
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Client tokens table (for client view access)
CREATE TABLE client_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  client_name TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- BigQuery sync configs table
CREATE TABLE bigquery_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('bigquery','snowflake')),
  connection_config JSONB NOT NULL DEFAULT '{}',
  tables_to_sync TEXT[] DEFAULT '{experiments,outcomes,metric_configs}',
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sync logs table
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_config_id UUID NOT NULL REFERENCES bigquery_sync_configs(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','failed')),
  rows_synced INTEGER DEFAULT 0,
  error_message TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);

-- Experiments indexes
CREATE INDEX idx_experiments_project_id ON experiments(project_id);
CREATE INDEX idx_experiments_created_at ON experiments(created_at);
CREATE INDEX idx_experiments_batch_id ON experiments(batch_id);
CREATE INDEX idx_experiments_category ON experiments(category);
CREATE INDEX idx_experiments_user_id ON experiments(user_id);

-- Outcomes indexes
CREATE INDEX idx_outcomes_project_date ON outcomes(project_id, date);
CREATE INDEX idx_outcomes_platform ON outcomes(platform);

-- Organization members indexes
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_org_id ON org_members(org_id);

-- Projects indexes
CREATE INDEX idx_projects_org_id ON projects(org_id);

-- Batches indexes
CREATE INDEX idx_batches_project_id ON batches(project_id);
CREATE INDEX idx_batches_user_id ON batches(user_id);

-- Impact cards indexes
CREATE INDEX idx_impact_cards_project_id ON impact_cards(project_id);
CREATE INDEX idx_impact_cards_experiment_id ON impact_cards(experiment_id);

-- AI chats indexes
CREATE INDEX idx_ai_chats_project_id ON ai_chats(project_id);
CREATE INDEX idx_ai_chats_user_id ON ai_chats(user_id);

-- AI highlights indexes
CREATE INDEX idx_ai_highlights_project_id ON ai_highlights(project_id);
CREATE INDEX idx_ai_highlights_date ON ai_highlights(date);

-- Metric configs indexes
CREATE INDEX idx_metric_configs_project_id ON metric_configs(project_id);

-- Client tokens indexes
CREATE INDEX idx_client_tokens_token ON client_tokens(token);
CREATE INDEX idx_client_tokens_project_id ON client_tokens(project_id);

-- API keys indexes
CREATE INDEX idx_api_keys_org_id ON api_keys(org_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);

-- BigQuery sync configs indexes
CREATE INDEX idx_bigquery_sync_configs_org_id ON bigquery_sync_configs(org_id);
CREATE INDEX idx_bigquery_sync_configs_project_id ON bigquery_sync_configs(project_id);

-- Sync logs indexes
CREATE INDEX idx_sync_logs_config_id ON sync_logs(sync_config_id);
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigquery_sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/update their own record
CREATE POLICY profiles_select_own ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY profiles_insert_own ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Organizations: accessible by organization members only
CREATE POLICY org_select ON organizations FOR SELECT
  USING (id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY org_update ON organizations FOR UPDATE
  USING (id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  ));

CREATE POLICY org_insert ON organizations FOR INSERT
  WITH CHECK (true); -- Users can create new orgs

CREATE POLICY org_delete ON organizations FOR DELETE
  USING (id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- Org members: accessible by organization members
CREATE POLICY org_members_select ON org_members FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY org_members_insert ON org_members FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  ));

CREATE POLICY org_members_update ON org_members FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  ));

CREATE POLICY org_members_delete ON org_members FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  ));

-- Projects: accessible by organization members
CREATE POLICY projects_select ON projects FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY projects_insert ON projects FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY projects_update ON projects FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY projects_delete ON projects FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  ));

-- Experiments: accessible by project's organization members
CREATE POLICY experiments_select ON experiments FOR SELECT
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY experiments_insert ON experiments FOR INSERT
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY experiments_update ON experiments FOR UPDATE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY experiments_delete ON experiments FOR DELETE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

-- Batches: accessible by project's organization members
CREATE POLICY batches_select ON batches FOR SELECT
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY batches_insert ON batches FOR INSERT
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY batches_update ON batches FOR UPDATE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY batches_delete ON batches FOR DELETE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

-- Outcomes: accessible by project's organization members
CREATE POLICY outcomes_select ON outcomes FOR SELECT
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY outcomes_insert ON outcomes FOR INSERT
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY outcomes_update ON outcomes FOR UPDATE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY outcomes_delete ON outcomes FOR DELETE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

-- Metric configs: accessible by project's organization members
CREATE POLICY metric_configs_select ON metric_configs FOR SELECT
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY metric_configs_insert ON metric_configs FOR INSERT
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY metric_configs_update ON metric_configs FOR UPDATE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY metric_configs_delete ON metric_configs FOR DELETE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

-- Impact cards: accessible by project's organization members
CREATE POLICY impact_cards_select ON impact_cards FOR SELECT
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY impact_cards_insert ON impact_cards FOR INSERT
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY impact_cards_update ON impact_cards FOR UPDATE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

CREATE POLICY impact_cards_delete ON impact_cards FOR DELETE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

-- AI chats: accessible by project's organization members
CREATE POLICY ai_chats_select ON ai_chats FOR SELECT
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY ai_chats_insert ON ai_chats FOR INSERT
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY ai_chats_update ON ai_chats FOR UPDATE
  USING (user_id = auth.uid()); -- Users can only update their own chats

CREATE POLICY ai_chats_delete ON ai_chats FOR DELETE
  USING (user_id = auth.uid()); -- Users can only delete their own chats

-- AI highlights: accessible by project's organization members
CREATE POLICY ai_highlights_select ON ai_highlights FOR SELECT
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY ai_highlights_insert ON ai_highlights FOR INSERT
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY ai_highlights_delete ON ai_highlights FOR DELETE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager', 'operator')
  ));

-- Client tokens: accessible by project's organization members
CREATE POLICY client_tokens_select ON client_tokens FOR SELECT
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY client_tokens_insert ON client_tokens FOR INSERT
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager')
  ));

CREATE POLICY client_tokens_delete ON client_tokens FOR DELETE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager')
  ));

-- API keys: accessible by organization members
CREATE POLICY api_keys_select ON api_keys FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY api_keys_insert ON api_keys FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  ));

CREATE POLICY api_keys_delete ON api_keys FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  ));

-- BigQuery sync configs: accessible by organization members
CREATE POLICY bigquery_sync_configs_select ON bigquery_sync_configs FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY bigquery_sync_configs_insert ON bigquery_sync_configs FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  ));

CREATE POLICY bigquery_sync_configs_update ON bigquery_sync_configs FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  ));

CREATE POLICY bigquery_sync_configs_delete ON bigquery_sync_configs FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  ));

-- Sync logs: accessible by organization members
CREATE POLICY sync_logs_select ON sync_logs FOR SELECT
  USING (sync_config_id IN (
    SELECT bsc.id FROM bigquery_sync_configs bsc
    JOIN org_members om ON om.org_id = bsc.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY sync_logs_insert ON sync_logs FOR INSERT
  WITH CHECK (sync_config_id IN (
    SELECT bsc.id FROM bigquery_sync_configs bsc
    JOIN org_members om ON om.org_id = bsc.org_id
    WHERE om.user_id = auth.uid()
  ));

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to handle new user creation (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when new auth user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user deletion (cleanup profile)
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = old.id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to delete profile when auth user is deleted
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles (extends auth.users)';
COMMENT ON TABLE organizations IS 'Organizations (companies/teams)';
COMMENT ON TABLE org_members IS 'Organization membership and roles';
COMMENT ON TABLE projects IS 'Ad account projects';
COMMENT ON TABLE experiments IS 'Change log entries (tweaks)';
COMMENT ON TABLE batches IS 'Grouped experiments within 30 minutes';
COMMENT ON TABLE outcomes IS 'KPI data (daily metrics)';
COMMENT ON TABLE metric_configs IS 'Custom metric formulas';
COMMENT ON TABLE impact_cards IS 'Before/after analysis cards';
COMMENT ON TABLE ai_chats IS 'AI chat conversations';
COMMENT ON TABLE ai_highlights IS 'AI-detected KPI anomalies';
COMMENT ON TABLE client_tokens IS 'Client view access tokens';
COMMENT ON TABLE api_keys IS 'API keys for external integrations';
COMMENT ON TABLE bigquery_sync_configs IS 'BigQuery/Snowflake sync configurations';
COMMENT ON TABLE sync_logs IS 'Sync execution logs';

COMMENT ON COLUMN metric_configs.formula IS 'Custom formula e.g., (Revenue - COGS) / Cost';
COMMENT ON COLUMN metric_configs.improvement_direction IS 'Direction of improvement: up or down';
COMMENT ON COLUMN outcomes.custom_columns IS 'JSON object for CSV columns not in standard schema';
COMMENT ON COLUMN projects.north_star_kpi IS 'Primary KPI for this project';
COMMENT ON COLUMN projects.sub_kpis IS 'Up to 5 secondary KPIs';
COMMENT ON COLUMN profiles.id IS 'References auth.users(id)';
