-- Add campaign_name column to spreadsheet_configs for per-config campaign override
ALTER TABLE spreadsheet_configs ADD COLUMN campaign_name TEXT DEFAULT NULL;
