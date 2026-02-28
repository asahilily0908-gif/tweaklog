-- experiments.batch_id を UUID → TEXT に変更（batch-aggregator.ts が TEXT 形式の ID を返すため）
ALTER TABLE experiments ALTER COLUMN batch_id TYPE TEXT USING batch_id::TEXT;
