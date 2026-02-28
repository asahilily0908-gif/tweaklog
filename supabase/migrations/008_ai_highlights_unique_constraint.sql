-- ai_highlights に UPSERT 用のユニーク制約を追加
CREATE UNIQUE INDEX IF NOT EXISTS ai_highlights_project_date_metric
  ON ai_highlights(project_id, date, metric_name);
