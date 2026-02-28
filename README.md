# Tweaklog

> 広告の"変えた"を、成果に変える。

広告運用の変更ログ × 効果比較 × AI分析。変更のインパクトを可視化して、チームの判断力を高めるSaaS。

## 主な機能

- **変更ログ記録** — 広告の変更（入札・クリエイティブ・ターゲティング・予算・構成）を一元管理。30分以内の連続変更はバッチ自動集約
- **Impact Card（効果比較）** — 変更前後のKPIを自動比較、9段階スコア（-4〜+4）で効果を可視化
- **カスタム数式エディタ** — 粗利ROASやLTV効率など、自由に派生指標を定義。テンプレート + 自由記述 + リアルタイムプレビュー
- **AIハイライト** — KPIの急変動を自動検知（2σ/3σベース）、⚡マークで表示
- **KPIダッシュボード** — 北極星KPIを中心に変更前後のCPA・CTR・CVR等を可視化
- **AI分析チャット** — 変更履歴とKPIデータをもとにAIが改善提案
- **セットアップウィザード** — 4ステップ（KPI設定→データ連携→指標設定→完了）で初期設定
- **Google スプレッドシート連携** — URLを貼るだけでKPIデータを自動取得。ヘッダー行自動検出、列マッピング、ワンクリック再同期
- **コマンドパレット** — Ctrl+K（Cmd+K）で即起動。ナビゲーション、変更記録、自然言語入力に対応
- **チーム管理** — 組織・プロジェクト単位でメンバー招待、ロール管理（Owner/Admin/Member）
- **MCP サーバー** — エージェントAI（Claude Desktop, OpenClaw等）からの直接読み書き対応
- **多言語対応** — 日本語 / 英語

## テックスタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript (strict) |
| スタイル | Tailwind CSS v4 + Geist Sans/Mono |
| 認証 | Supabase Auth |
| DB | Supabase (PostgreSQL) + RLS |
| 決済 | Stripe (Free / Pro / Team プラン) |
| AI | Anthropic Claude API |
| MCP | @modelcontextprotocol/sdk + mcp-handler |
| テスト | Vitest（89テスト） |
| デプロイ | Vercel |

## セットアップ

```bash
git clone https://github.com/asahilily0908-gif/tweaklog.git
cd tweaklog
pnpm install
cp .env.example .env.local  # 環境変数を設定
pnpm dev
```

### 必要な環境変数

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_TEAM_PRICE_ID=
NEXT_PUBLIC_APP_URL=
```

## テスト

```bash
pnpm test        # 全89テスト実行
pnpm test:watch  # ウォッチモード
```

テストスイート:

- `formula-parser.test.ts` — カスタム数式パーサー（33テスト）
- `score-calculator.test.ts` — 9段階スコア算出（29テスト）
- `highlight-detector.test.ts` — σベース異常検知（14テスト）
- `batch-aggregator.test.ts` — バッチ自動集約（13テスト）

## MCP サーバー

エンドポイント: `https://tweaklog.vercel.app/api/mcp/mcp`

### Claude Desktop 設定

```json
{
  "mcpServers": {
    "tweaklog": {
      "url": "https://tweaklog.vercel.app/api/mcp/mcp"
    }
  }
}
```

### 利用可能なツール

| ツール名 | 説明 |
|---------|------|
| `tweaklog_dashboard_summary` | プロジェクトのKPIサマリーを取得 |
| `tweaklog_log_change` | 変更ログを記録（カテゴリ: bid/creative/targeting/budget/structure） |
| `tweaklog_search_experiments` | 実験・変更履歴を検索 |
| `tweaklog_get_impact` | 特定の変更のインパクト（前後比較）を取得 |
| `tweaklog_get_highlights` | 注目すべき変更・異常値をハイライト |
| `tweaklog_list_projects` | プロジェクト一覧を取得 |

## プロジェクト構成

```
app/
├── (auth)/              # ログイン・サインアップ
├── (public)/            # ランディングページ
├── (app)/app/[project]/
│   ├── dashboard/       # KPIダッシュボード
│   ├── experiments/     # 変更ログ一覧
│   ├── import/          # データインポート（スプレッドシート / CSV）
│   ├── impact/[id]/     # Impact Card（効果比較）
│   ├── setup/           # セットアップウィザード
│   ├── ai-chat/         # AI分析チャット
│   └── settings/        # 設定（プロジェクト/KPI/チーム/請求/API連携）
├── api/
│   ├── mcp/[transport]/ # MCPサーバー
│   ├── spreadsheet/     # Google Sheets連携API
│   ├── stripe/          # Stripe Webhook
│   └── ...
components/
├── command-palette/     # コマンドパレット（Ctrl+K）
├── experiments/         # 変更一覧・記録フォーム
├── impact/              # Impact Card・スコアバッジ
├── import/              # スプレッドシート・CSVインポート
├── metrics/             # カスタム数式エディタ
├── setup/               # セットアップウィザード
├── ai/                  # AIハイライトカード
├── dashboard/           # ダッシュボードマーカー
├── layout/              # Sidebar, Header
├── settings/            # 設定ページ各セクション
└── ui/                  # 共通UIコンポーネント
lib/
├── metrics/             # formula-parser, score-calculator
├── ai/                  # highlight-detector
├── experiments/         # batch-aggregator
├── supabase/            # Supabaseクライアント
├── stripe/              # Stripe設定
├── i18n/                # 多言語辞書
└── hooks/               # カスタムフック
```

## ライセンス

MIT
