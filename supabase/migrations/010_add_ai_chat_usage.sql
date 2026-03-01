CREATE TABLE ai_chat_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ai_chat_usage_user_month ON ai_chat_usage(user_id, created_at);
ALTER TABLE ai_chat_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own usage" ON ai_chat_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own usage" ON ai_chat_usage FOR SELECT USING (auth.uid() = user_id);
