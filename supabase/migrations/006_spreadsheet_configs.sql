-- Spreadsheet import configurations
CREATE TABLE spreadsheet_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  spreadsheet_url TEXT NOT NULL,
  sheet_gid TEXT DEFAULT '0',
  header_row INTEGER DEFAULT 1,
  start_column TEXT DEFAULT 'A',
  end_column TEXT,
  column_mappings JSONB NOT NULL DEFAULT '{}',
  auto_sync BOOLEAN DEFAULT false,
  sync_schedule TEXT DEFAULT 'daily',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_spreadsheet_configs_project ON spreadsheet_configs(project_id);

ALTER TABLE spreadsheet_configs DISABLE ROW LEVEL SECURITY;
