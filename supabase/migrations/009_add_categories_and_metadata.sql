-- Add metadata JSONB column and expand category CHECK constraint
-- New categories: query, creative_version, bid_strategy, audience, placement, tracking, pmax_asset, automation

-- 1. Add metadata column
ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 2. Drop old category CHECK and add expanded one
ALTER TABLE experiments
  DROP CONSTRAINT IF EXISTS experiments_category_check;

ALTER TABLE experiments
  ADD CONSTRAINT experiments_category_check
  CHECK (category IN (
    'bid', 'creative', 'targeting', 'budget', 'structure',
    'query', 'creative_version', 'bid_strategy', 'audience',
    'placement', 'tracking', 'pmax_asset', 'automation'
  ));

-- 3. GIN index for metadata queries
CREATE INDEX IF NOT EXISTS idx_experiments_metadata
  ON experiments USING gin (metadata);
