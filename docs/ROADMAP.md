# ロードマップ

## 完了済み ✅

### インフラ・基盤
- [x] Supabase DB スキーマ & RLS ポリシー
- [x] Supabase Auth（メール/パスワード）
- [x] Stripe 課金連携（Free / Pro / Team）
- [x] チーム招待・メンバー管理
- [x] 組織プラン反映（PlanBadge, usePlan, PlanContext）
- [x] Vercel デプロイ
- [x] i18n（日本語/英語）
- [x] モバイルレスポンシブ

### デザイン
- [x] Figma デザイン反映（サイドバー、ダッシュボード、シャドー調整）
- [x] ランディングページ（ヒーロー、料金、FAQ、フッター、MCP訴求セクション）
- [x] ログイン/サインアップページデザイン

### コア機能（Supabase接続済み・本番稼働）
- [x] 変更ログ記録・一覧（ExperimentsContent — Supabase CRUD、カテゴリフィルター、Free プラン制限、i18n）
- [x] 変更記録モーダル（NewChangeModal — Supabase 保存）
- [x] KPIダッシュボード（DashboardContent — outcomes, experiments, metricConfigs, aiHighlights を Supabase から取得）
- [x] Impact Card パネル（ImpactCardPanel — computeImpactForExperiment で実データからスコア算出、Before/After 比較テーブル）
- [x] スコアバッジ（ScoreBadge — Experiments List 内で北極星KPIベースのスコア表示）
- [x] Google スプレッドシート連携（SpreadsheetImport — API取得、ヘッダー自動検出、列マッピング、outcomes 保存、再同期）
- [x] CSVインポート（CsvImportContent — アップロード、列マッピング、outcomes 保存）
- [x] AI分析チャット（ChatInterface — Supabase からチャット履歴取得、プラン制限）

### コアライブラリ（テスト済み）
- [x] カスタム数式パーサー（formula-parser.ts — 再帰降下パーサー、33テスト）
- [x] 9段階スコア算出（score-calculator.ts — computeImpactForExperiment 含む、29テスト）
- [x] AIハイライト異常検知（highlight-detector.ts — 2σ/3σ、14テスト）
- [x] バッチ自動集約（batch-aggregator.ts — 30分窓、13テスト）

### UI コンポーネント（追加実装）
- [x] セットアップウィザード（4ステップ: KPI→データ連携→指標設定→完了）
- [x] カスタム数式エディタUI（FormulaEditor — テンプレート、オートコンプリート、リアルタイムプレビュー）
- [x] コマンドパレット（Ctrl+K — 8コマンド、自然言語検知、キーボード操作）
- [x] NewChangeForm（コマンドパレット内の変更記録フォーム — 自然言語プリフィル）
- [x] 設定画面 API連携タブ（MCPエンドポイント、Claude Desktop設定、ツール一覧）

### エージェントAI連携
- [x] MCP サーバー実装（6ツール）
- [x] ランディングページにMCP訴求セクション

## 統合待ち 🔌

以下は UI コンポーネントは作成済みだが、既存の Supabase 接続済みコンポーネントとの統合が必要:

- [ ] セットアップウィザード → projects テーブルに北極星KPI・サブKPI・メトリクス設定を保存（現在は console.log のみ）
- [ ] FormulaEditor → metric_configs テーブルとの CRUD 接続
- [x] formula-evaluator.ts → formula-parser.ts に統合済み（evaluateFormulaSafe追加）。DashboardContent と preview/route.ts のimport変更完了
- [ ] highlight-detector.ts → 日次バッチ実行（pg_cron）との接続
- [ ] batch-aggregator.ts → experiments 作成時の自動バッチ割り当て

## 次のマイルストーン 🎯

### 短期（1-2週間）
- [ ] 上記「統合待ち」の接続
- [ ] OGP / メタタグ設定（SNSシェア対応）
- [ ] Stripe 本番キー切り替え

### 中期（1-2ヶ月）
- [ ] Google Ads API 連携（KPI自動取得）
- [ ] Meta (Facebook/Instagram) Ads API 連携
- [ ] メール送信による招待（現在はリンクコピー方式）
- [ ] 利用規約・プライバシーポリシーページ
- [ ] アナリティクス導入（Google Analytics / Plausible）

### 長期（3ヶ月〜）
- [ ] Claude Cowork プラグイン開発
- [ ] Claude Apps 対応
- [ ] OpenClaw エージェント連携ガイド
- [ ] Yahoo! 広告 API 連携
- [ ] Slack / Teams 通知連携
- [ ] ダークモード
