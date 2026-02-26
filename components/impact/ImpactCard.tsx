'use client'

import { useState, useMemo } from 'react'
import { Copy, ArrowRight } from 'lucide-react'
import { calculateScore, getDateRange } from '@/lib/metrics/score-calculator'
import ScoreBadge from './ScoreBadge'
import MetricsTable from './MetricsTable'
import PeriodSelector from './PeriodSelector'
import AiComment from './AiComment'

interface MetricRow {
  name: string
  displayName: string
  beforeValue: number | null
  afterValue: number | null
  changePercent: number | null
  improvementDirection: 'up' | 'down'
  isCustom: boolean
}

interface ImpactCardProps {
  experiment: {
    id: string
    category: string
    platform: string
    campaign?: string
    beforeValue?: string
    afterValue?: string
    reason?: string
    createdAt: string
  }
  projectId: string
}

const MOCK_METRICS: MetricRow[] = [
  { name: 'impressions', displayName: 'Impressions', beforeValue: 45000, afterValue: 52000, changePercent: 15.6, improvementDirection: 'up', isCustom: false },
  { name: 'clicks', displayName: 'Clicks', beforeValue: 1800, afterValue: 2100, changePercent: 16.7, improvementDirection: 'up', isCustom: false },
  { name: 'ctr', displayName: 'CTR', beforeValue: 4.0, afterValue: 4.04, changePercent: 1.0, improvementDirection: 'up', isCustom: false },
  { name: 'cpc', displayName: 'CPC', beforeValue: 120, afterValue: 105, changePercent: -12.5, improvementDirection: 'down', isCustom: false },
  { name: 'cost', displayName: 'Cost', beforeValue: 216000, afterValue: 220500, changePercent: 2.1, improvementDirection: 'down', isCustom: false },
  { name: 'conversions', displayName: 'Conversions', beforeValue: 45, afterValue: 58, changePercent: 28.9, improvementDirection: 'up', isCustom: false },
  { name: 'cvr', displayName: 'CVR', beforeValue: 2.5, afterValue: 2.76, changePercent: 10.4, improvementDirection: 'up', isCustom: false },
  { name: 'cpa', displayName: 'CPA', beforeValue: 4800, afterValue: 3802, changePercent: -20.8, improvementDirection: 'down', isCustom: false },
  { name: 'roas', displayName: 'ROAS', beforeValue: 320, afterValue: 410, changePercent: 28.1, improvementDirection: 'up', isCustom: false },
  { name: 'gross_roas', displayName: '粗利ROAS', beforeValue: 180, afterValue: 235, changePercent: 30.6, improvementDirection: 'up', isCustom: true },
]

const MOCK_NORTH_STAR = 'conversions'

const MOCK_AI_COMMENT =
  'コンバージョン数が28.9%増加しており、入札変更が効果的だった可能性があります。CPAも20.8%改善しています。ただし、Impressionsの増加（15.6%）とCostの微増（2.1%）も見られるため、リーチ拡大による量的効果と、入札最適化による質的効果の両方が寄与していると考えられます。外部要因（季節性、競合動向等）の影響も考慮してください。'

const CATEGORY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  bid: { label: '入札', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  creative: { label: 'クリエイティブ', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  targeting: { label: 'ターゲティング', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  budget: { label: '予算', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  structure: { label: '構造', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
}

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ImpactCard({
  experiment,
}: ImpactCardProps) {
  const defaultRange = getDateRange(experiment.createdAt, 7)
  const [periods, setPeriods] = useState(defaultRange)
  const [copied, setCopied] = useState(false)

  // Calculate score from north star metric
  const score = useMemo(() => {
    const northStar = MOCK_METRICS.find((m) => m.name === MOCK_NORTH_STAR)
    if (!northStar || northStar.changePercent === null) return 0
    return calculateScore(northStar.changePercent, northStar.improvementDirection)
  }, [])

  const northStarChange = MOCK_METRICS.find(
    (m) => m.name === MOCK_NORTH_STAR
  )?.changePercent

  const cat = CATEGORY_CONFIG[experiment.category] ?? CATEGORY_CONFIG.structure

  async function handleCopyToClipboard() {
    const lines = MOCK_METRICS.map((m) => {
      const before = m.beforeValue?.toLocaleString('ja-JP') ?? '—'
      const after = m.afterValue?.toLocaleString('ja-JP') ?? '—'
      const change =
        m.changePercent !== null
          ? `${m.changePercent >= 0 ? '+' : ''}${m.changePercent.toFixed(1)}%`
          : '—'
      return `${m.displayName}\t${before}\t${after}\t${change}`
    })
    const header = '指標\tBefore\tAfter\t変化率'
    const text = [header, ...lines].join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Left: Change info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md border px-2 py-1 text-xs font-medium ${cat.bg} ${cat.text} ${cat.border}`}
              >
                {cat.label}
              </span>
              <span className="text-sm text-slate-500">
                {experiment.platform}
              </span>
              {experiment.campaign && (
                <span className="text-sm text-slate-400">
                  / {experiment.campaign}
                </span>
              )}
            </div>

            {experiment.beforeValue && experiment.afterValue && (
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-slate-900">
                  {experiment.beforeValue}
                </span>
                <ArrowRight className="h-5 w-5 text-slate-400" />
                <span className="text-lg font-semibold text-indigo-600">
                  {experiment.afterValue}
                </span>
              </div>
            )}

            {experiment.reason && (
              <p className="text-sm italic text-slate-600">
                {experiment.reason}
              </p>
            )}

            <p className="text-xs text-slate-400">
              {formatDateTime(experiment.createdAt)}
            </p>
          </div>

          {/* Right: Score badge */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Impact Score
            </p>
            <ScoreBadge
              score={score}
              changePercent={northStarChange ?? undefined}
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* Period selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-medium text-slate-700">比較期間</h3>
        <PeriodSelector
          beforeStart={periods.beforeStart}
          beforeEnd={periods.beforeEnd}
          afterStart={periods.afterStart}
          afterEnd={periods.afterEnd}
          onChange={setPeriods}
          changeDate={experiment.createdAt}
        />
      </div>

      {/* Metrics table */}
      <MetricsTable metrics={MOCK_METRICS} northStarKpi={MOCK_NORTH_STAR} />

      {/* AI comment */}
      <AiComment comment={MOCK_AI_COMMENT} />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopyToClipboard}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Copy className="h-4 w-4" />
          {copied ? 'コピー済み' : 'クリップボードにコピー'}
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-400 opacity-50 cursor-not-allowed"
        >
          PDFで出力
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-400 opacity-50 cursor-not-allowed"
        >
          🤖 分析を実行
        </button>
      </div>
    </div>
  )
}
