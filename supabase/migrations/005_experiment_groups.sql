-- Experiment Groups: group campaigns into testing/steady/completed
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

-- Add group_id to experiments
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES experiment_groups(id) ON DELETE SET NULL;

-- Disable RLS for now (we'll fix later)
ALTER TABLE experiment_groups DISABLE ROW LEVEL SECURITY;
