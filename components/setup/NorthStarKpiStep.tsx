'use client'

import {
  Target,
  DollarSign,
  Users,
  Calendar,
  Smartphone,
  Pencil,
} from 'lucide-react'
import type { WizardData } from './SetupWizard'

interface NorthStarKpiStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  isNewSetup?: boolean
}

const KPI_OPTIONS = [
  { value: 'conversions', label: 'CV数', icon: Target },
  { value: 'revenue', label: '売上 / Revenue', icon: DollarSign },
  { value: 'mql', label: 'MQL数', icon: Users },
  { value: 'reservations', label: '来店予約数', icon: Calendar },
  { value: 'app_installs', label: 'アプリインストール数', icon: Smartphone },
  { value: 'custom', label: 'カスタム', icon: Pencil },
]

const SUB_KPI_OPTIONS = [
  'Impressions',
  'Clicks',
  'CTR',
  'CPC',
  'Cost',
  'Conversions',
  'CVR',
  'CPA',
  'ROAS',
]

export default function NorthStarKpiStep({
  data,
  onChange,
  isNewSetup,
}: NorthStarKpiStepProps) {
  function toggleSubKpi(kpi: string) {
    if (data.subKpis.includes(kpi)) {
      onChange({ subKpis: data.subKpis.filter((k) => k !== kpi) })
    } else if (data.subKpis.length < 5) {
      onChange({ subKpis: [...data.subKpis, kpi] })
    }
  }

  return (
    <div className="space-y-10">
      {/* Org & Project name (new setup only) */}
      {isNewSetup && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              組織名 / Organization Name
            </label>
            <input
              type="text"
              value={data.orgName}
              onChange={e => onChange({ orgName: e.target.value })}
              placeholder="例: 株式会社〇〇 マーケティング部"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              プロジェクト名 / Project Name
            </label>
            <input
              type="text"
              value={data.projectName}
              onChange={e => onChange({ projectName: e.target.value })}
              placeholder="例: Google Ads メインアカウント"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
          <hr className="border-gray-200" />
        </div>
      )}

      {/* Main KPI selection */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            あなたのビジネスで最も重要な指標は？
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            1つだけ選んでください。ダッシュボードの中心指標になり、変更の効果判定の基準になります。
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {KPI_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = data.northStarKpi === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ northStarKpi: option.value })}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Icon
                  className={`h-6 w-6 mb-3 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}
                />
                <span
                  className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}
                >
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>

        {data.northStarKpi === 'custom' && (
          <div className="animate-fade-in-up">
            <input
              type="text"
              value={data.northStarKpiCustomName}
              onChange={(e) =>
                onChange({ northStarKpiCustomName: e.target.value })
              }
              placeholder="例: 粗利ベースROAS、LTV効率..."
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Sub KPIs */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            サブKPI（最大5つ）
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            北極星KPIを補完する指標を選んでください。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUB_KPI_OPTIONS.map((kpi) => {
            const isSelected = data.subKpis.includes(kpi)
            const isDisabled = !isSelected && data.subKpis.length >= 5
            return (
              <button
                key={kpi}
                type="button"
                onClick={() => toggleSubKpi(kpi)}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : isDisabled
                      ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {kpi}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-400">
          {data.subKpis.length}/5 選択中
        </p>
      </div>
    </div>
  )
}
