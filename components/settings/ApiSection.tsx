'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const MCP_URL = 'https://tweaklog.vercel.app/api/mcp/mcp'

const CLAUDE_CONFIG = `{
  "mcpServers": {
    "tweaklog": {
      "url": "${MCP_URL}"
    }
  }
}`

const MCP_TOOLS = [
  { name: 'tweaklog_dashboard_summary', desc: 'プロジェクトのKPIサマリーを取得' },
  { name: 'tweaklog_log_change', desc: '変更ログを記録' },
  { name: 'tweaklog_search_experiments', desc: '実験・変更履歴を検索' },
  { name: 'tweaklog_get_impact', desc: '変更のインパクト（前後比較）を取得' },
  { name: 'tweaklog_get_highlights', desc: '注目すべき変更・異常値を取得' },
  { name: 'tweaklog_list_projects', desc: 'プロジェクト一覧を取得' },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all duration-150 hover:bg-gray-50"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          コピー済み
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          コピー
        </>
      )}
    </button>
  )
}

export default function ApiSection() {
  return (
    <div className="space-y-6">
      {/* MCP Endpoint */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">MCP サーバー</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            エージェントAI（Claude Desktop, OpenClaw等）から Tweaklog に直接接続できます。
          </p>
        </div>
        <div className="px-4 sm:px-6 py-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">エンドポイント URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={MCP_URL}
              className="flex-1 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm font-mono text-gray-700 focus:outline-none"
            />
            <CopyButton text={MCP_URL} />
          </div>
        </div>
      </section>

      {/* Claude Desktop Config */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Claude Desktop 設定</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            以下の JSON を Claude Desktop の設定ファイルに追加してください。
          </p>
        </div>
        <div className="px-4 sm:px-6 py-5">
          <div className="relative">
            <div className="rounded-xl bg-slate-900 p-4 sm:p-6 font-mono text-sm text-green-400 overflow-x-auto">
              <pre className="whitespace-pre">{CLAUDE_CONFIG}</pre>
            </div>
            <div className="absolute top-3 right-3">
              <CopyButton text={CLAUDE_CONFIG} />
            </div>
          </div>
        </div>
      </section>

      {/* Available Tools */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">利用可能な MCP ツール</h2>
        </div>
        <div className="px-4 sm:px-6 py-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ツール名</th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">説明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MCP_TOOLS.map((tool) => (
                  <tr key={tool.name}>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs font-mono text-slate-700">
                        {tool.name}
                      </code>
                    </td>
                    <td className="py-3 text-sm text-gray-600">{tool.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* API Keys (Coming Soon) */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">API キー（近日公開）</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            REST API でのアクセス用 API キーの発行機能を準備中です。
          </p>
        </div>
        <div className="px-4 sm:px-6 py-5">
          <button
            type="button"
            disabled
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed"
          >
            APIキーを生成
          </button>
        </div>
      </section>
    </div>
  )
}
