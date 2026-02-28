# ロードマップ

## 完了済み ✅

### インフラ・基盤
- [x] Supabase DB スキーマ & RLS ポリシー
- [x] Supabase Auth（メール/パスワード）
- [x] Stripe 課金連携（Free / Pro / Team）
- [x] チーム招待・メンバー管理
- [x] 組織プラン反映（PlanBadge, usePlan）
- [x] Vercel デプロイ
- [x] i18n（日本語/英語）
- [x] モバイルレスポンシブ

### デザイン
- [x] Figma デザイン反映（サイドバー、ダッシュボード、シャドー調整）
- [x] ランディングページ（ヒーロー、料金、FAQ、フッター、MCP訴求セクション）
- [x] ログイン/サインアップページデザイン

### コア機能
- [x] 変更ログ記録（5カテゴリ、Before/After、タグ、Internal/Client Note）
- [x] KPIダッシュボード（プラットフォームフィルター、グラフ、変更マーカー）
- [x] Google スプレッドシート連携（URL貼り付け→自動取得→列マッピング→再同期）
- [x] CSVインポート
- [x] AI分析チャット

### 新機能（本セッションで実装）
- [x] カスタム数式パーサー（formula-parser.ts、再帰降下、33テスト）
- [x] 9段階スコア算出（score-calculator.ts、29テスト）
- [x] AIハイライト異常検知（highlight-detector.ts、2σ/3σ、14テスト）
- [x] バッチ自動集約（batch-aggregator.ts、30分窓、13テスト）
- [x] セットアップウィザード（4ステップ: KPI→データ連携→指標設定→完了）
- [x] カスタム数式エディタUI（テンプレート、オートコンプリート、リアルタイムプレビュー）
- [x] Impact Card（効果比較カード、スコアバッジ、指標テーブル、期間セレクター、AI補足）
- [x] Experiments List（カテゴリバッジ、Diff表示、バッチバッジ、スコアバッジ）
- [x] コマンドパレット（Ctrl+K、8コマンド、自然言語検知、キーボード操作）
- [x] NewChangeForm（変更記録フォーム、自然言語プリフィル）
- [x] 設定画面 API連携タブ（MCPエンドポイント、Claude Desktop設定、ツール一覧）

### エージェントAI連携
- [x] MCP サーバー実装（6ツール）
- [x] ランディングページにMCP訴求セクション

## 未接続（UIは完成、API接続待ち） 🔌

- [ ] セットアップウィザード → Supabase 保存
- [ ] NewChangeForm → Supabase 保存
- [ ] Impact Card → 実データでのKPI取得・スコア算出
- [ ] AIハイライト → 日次バッチ実行（pg_cron）
- [ ] AI補足コメント → Claude API 呼び出し
- [ ] Experiments List → Supabase からの実データ読み取り

## 次のマイルストーン 🎯

### 短期（1-2週間）
- [ ] 上記「未接続」機能のAPI接続（モック → 実データ）
- [ ] OGP / メタタグ設定（SNSシェア対応）

### 中期（1-2ヶ月）
- [ ] Google Ads API 連携（KPI自動取得）
- [ ] Meta (Facebook/Instagram) Ads API 連携
- [ ] メール送信による招待（現在はリンクコピー方式）
- [ ] 利用規約・プライバシーポリシーページ
- [ ] アナリティクス導入（Google Analytics / Plausible）
- [ ] Stripe 本番キー切り替え

### 長期（3ヶ月〜）
- [ ] Claude Cowork プラグイン開発
- [ ] Claude Apps 対応
- [ ] OpenClaw エージェント連携ガイド
- [ ] Yahoo! 広告 API 連携
- [ ] Slack / Teams 通知連携
- [ ] ダークモード
