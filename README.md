# Tweaklog

> 広告の"変えた"を、成果に変える。

広告運用の変更ログ × 効果比較 × AI分析。変更のインパクトを可視化して、チームの判断力を高めるSaaS。

## 主な機能

- **変更ログ記録** — 広告の変更（入札・クリエイティブ・ターゲティング・予算・構成）を一元管理
- **KPIダッシュボード** — 変更前後のCPA・CTR・CVR等を自動比較、インパクトを可視化
- **AI分析チャット** — 変更履歴とKPIデータをもとにAIが改善提案
- **チーム管理** — 組織・プロジェクト単位でメンバー招待、ロール管理（Owner/Admin/Member）
- **MCP サーバー** — エージェントAI（Claude Desktop, OpenClaw等）からの直接読み書き対応
- **多言語対応** — 日本語 / 英語

## テックスタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 + Geist Sans/Mono |
| 認証 | Supabase Auth |
| DB | Supabase (PostgreSQL) + RLS |
| 決済 | Stripe (Free / Pro / Team プラン) |
| AI | OpenAI API (GPT-4o) |
| MCP | @modelcontextprotocol/sdk + mcp-handler |
| デプロイ | Vercel |

## セットアップ

```bash
git clone https://github.com/asahilily0908-gif/Tweaklogdesignenhancements.git
cd Tweaklogdesignenhancements
npm install
cp .env.example .env.local  # 環境変数を設定
npm run dev
```

### 必要な環境変数

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
```

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
├── (auth)/          # ログイン・サインアップ
├── (public)/        # ランディングページ
├── (app)/app/[project]/
│   ├── dashboard/   # KPIダッシュボード
│   ├── experiments/ # 変更ログ一覧・追加
│   ├── import/      # データインポート（CSV）
│   ├── ai-chat/     # AI分析チャット
│   └── settings/    # 設定（プロジェクト/KPI/チーム/請求）
├── api/
│   ├── mcp/[transport]/ # MCPサーバーエンドポイント
│   ├── stripe/          # Stripe Webhook
│   └── ...
components/
├── layout/          # Sidebar, Header
├── settings/        # 設定ページ各セクション
└── ui/              # 共通UIコンポーネント
lib/
├── supabase/        # Supabaseクライアント・ヘルパー
├── stripe/          # Stripe設定
├── i18n/            # 多言語辞書
└── hooks/           # カスタムフック（usePlan等）
```

## ライセンス

MIT
