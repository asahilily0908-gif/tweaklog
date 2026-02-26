# アーキテクチャ

## 全体構成

```
[ブラウザ] → [Next.js App Router (Vercel)]
                 ├── Supabase Auth (認証)
                 ├── Supabase PostgreSQL + RLS (データ)
                 ├── Stripe (決済・プラン管理)
                 ├── OpenAI API (AI分析)
                 └── MCP Server (エージェントAI連携)

[エージェントAI] → [MCP Server /api/mcp/mcp] → [Supabase DB]
(Claude Desktop, OpenClaw等)
```

## DB スキーマ概要

主要テーブル:

- **profiles** — ユーザープロフィール
- **organizations** — 組織（plan: free/pro/team）
- **org_members** — 組織メンバー（role: owner/admin/member）
- **projects** — プロジェクト
- **experiments** — 変更ログ（category: bid/creative/targeting/budget/structure）
- **kpi_snapshots** — KPIスナップショット
- **invitations** — チーム招待

## 認証・認可

- Supabase Auth でメール/パスワード認証
- RLS (Row Level Security) で全テーブルのアクセス制御
- `getUserPlan()` は org_members → organizations の plan を参照

## 課金フロー

- Free → Pro/Team: Stripe Checkout Session → Webhook → `organizations.plan` 更新
- プラン: Free（0円, 1プロジェクト, 50実験/月）, Pro（¥2,980/月, 10プロジェクト, 無制限）, Team（¥9,800/月, 無制限, チーム機能）

## MCP サーバー

- ファイル: `app/api/mcp/[transport]/route.ts`
- basePath: `/api/mcp`
- SDK: `@modelcontextprotocol/sdk` v1.27.1 + `mcp-handler` v1.0.7
- ツール登録形式: `server.tool(name, description, zodSchema, callback)`（4引数形式）
- zod v3 使用（v4は mcp-handler と非互換）

## i18n

- `lib/i18n/dictionaries/ja.ts` / `en.ts`
- `useLocale()` フックでブラウザ言語を検出
- UIテキストは全て辞書経由
