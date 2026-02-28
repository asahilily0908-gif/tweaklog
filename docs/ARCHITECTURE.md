# アーキテクチャ

## 全体構成

```
[ブラウザ] → [Next.js 16 App Router (Vercel)]
                 ├── Supabase Auth (認証)
                 ├── Supabase PostgreSQL + RLS (データ)
                 ├── Stripe (決済・プラン管理)
                 ├── Anthropic Claude API (AI分析)
                 ├── Google Sheets CSV Export (スプレッドシート連携)
                 └── MCP Server (エージェントAI連携)

[エージェントAI] → [MCP Server /api/mcp/mcp] → [Supabase DB]
(Claude Desktop, OpenClaw等)
```

## コアライブラリ（lib/）

### formula-parser.ts（カスタム数式パーサー）
再帰降下パーサーで AST を構築・評価する。eval() は使用しない。
対応: 四則演算、カッコ、比較演算子（>, <, >=, <=, ==, !=）、関数（IF, SUM, AVG, MIN, MAX）、変数バインディング。
ゼロ除算は null を返す。未定義変数は Error をスロー。
33テストでカバー。

### score-calculator.ts（9段階スコア）
北極星KPIの変化率から -4〜+4 の9段階スコアを算出。
improvement_direction（up/down）に応じて正負を反転。
スコアに対応する色情報（Tailwind クラス）とラベルを返す。
29テストでカバー。

### highlight-detector.ts（異常検知）
直近30日の平均・標準偏差を算出し、2σ超=warning、3σ超=critical として検知。
データ5日未満はスキップ（統計的に無意味）。
14テストでカバー。

### batch-aggregator.ts（バッチ集約）
同一ユーザーの30分以内の連続変更をバッチとしてグルーピング。
2件以上の連続変更のみバッチとして扱う。
13テストでカバー。

## DB スキーマ概要

主要テーブル:
- **profiles** — ユーザープロフィール
- **organizations** — 組織（plan: free/pro/team）
- **org_members** — 組織メンバー（role: owner/admin/member）
- **projects** — プロジェクト（north_star_kpi, sub_kpis, platform）
- **experiments** — 変更ログ（category: bid/creative/targeting/budget/structure）
- **outcomes** — KPIデータ（日別、プラットフォーム別）
- **spreadsheet_configs** — Google Sheets連携設定（URL, gid, header_row, column_mappings）
- **invitations** — チーム招待

## 認証・認可

- Supabase Auth でメール/パスワード認証
- RLS (Row Level Security) で全テーブルのアクセス制御
- `getUserPlan()` は org_members → organizations の plan を参照

## 課金フロー

- Free → Pro/Team: Stripe Checkout Session → Webhook → `organizations.plan` 更新
- プラン: Free（0円, 1プロジェクト, 50実験/月）, Pro（¥2,980/月, 10プロジェクト, 無制限）, Team（¥9,800/月, 無制限, チーム機能）

## Google スプレッドシート連携

- `/api/spreadsheet/fetch` — Google Sheets の CSV エクスポート URL を使ってデータ取得
- ヘッダー行自動検出（最初の10行をスキャン、guessField() マッチ数が最多の行を採用）
- BOM対応、日本語日付パーサー（YYYY/M/D、和暦）
- column-mappings.ts に 40+ の JP/EN パターン
- spreadsheet_configs テーブルに設定を永続化（ワンクリック再同期）

## MCP サーバー

- ファイル: `app/api/mcp/[transport]/route.ts`
- basePath: `/api/mcp`
- SDK: `@modelcontextprotocol/sdk` v1.27.1 + `mcp-handler` v1.0.7
- ツール登録形式: `server.tool(name, description, zodSchema, callback)`（4引数形式）
- zod v3 使用（v4は mcp-handler と非互換）

## コマンドパレット

- Ctrl+K / Cmd+K でグローバルに起動
- 8コマンド（変更記録、検索、CSVインポート、ダッシュボード、変更履歴、AIチャット、設定、データインポート）
- 自然言語検知（「入札」「クリエイティブ」「円」等のパターンマッチ）
- キーボードナビゲーション（↑↓ Enter Esc）

## i18n

- `lib/i18n/dictionaries/ja.ts` / `en.ts`
- `useLocale()` フックでブラウザ言語を検出
- UIテキストは全て辞書経由
