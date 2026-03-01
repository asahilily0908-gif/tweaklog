'use client'

import type { WizardData } from './SetupWizard'

interface SetupCompleteStepProps {
  data: WizardData
}

const KPI_LABELS: Record<string, string> = {
  conversions: 'CV数',
  revenue: '売上 / Revenue',
  mql: 'MQL数',
  reservations: '来店予約数',
  app_installs: 'アプリインストール数',
}

export default function SetupCompleteStep({ data }: SetupCompleteStepProps) {
  const northStarLabel =
    data.northStarKpi === 'custom'
      ? data.northStarKpiCustomName
      : KPI_LABELS[data.northStarKpi] ?? data.northStarKpi

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          セットアップ完了！
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          以下の設定でダッシュボードを開始します。
        </p>
      </div>

      {/* Main KPI */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            メインKPI
          </h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="text-lg font-bold text-indigo-600">
            {northStarLabel}
          </div>
          {data.subKpis.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.subKpis.map((kpi) => (
                <span
                  key={kpi}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {kpi}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            分析指標
          </h3>
        </div>
        <div className="px-5 py-4">
          {data.metricConfigs.length > 0 ? (
            <div className="space-y-2">
              {data.metricConfigs.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-gray-900">
                    {m.displayName}
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                      {m.formula}
                    </code>
                    <span className="text-xs text-gray-400">
                      {m.improvementDirection === 'up' ? '↑' : '↓'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              未設定（後から設定可能）
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
