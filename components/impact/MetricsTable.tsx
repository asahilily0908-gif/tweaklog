'use client'

interface MetricRow {
  name: string
  displayName: string
  beforeValue: number | null
  afterValue: number | null
  changePercent: number | null
  improvementDirection: 'up' | 'down'
  isCustom: boolean
}

interface MetricsTableProps {
  metrics: MetricRow[]
  northStarKpi?: string
}

function formatValue(value: number | null): string {
  if (value === null) return '—'
  return value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })
}

function formatPercent(value: number | null): string {
  if (value === null) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

function getChangeColor(value: number | null): string {
  if (value === null) return 'text-slate-400'
  if (Math.abs(value) < 0.1) return 'text-slate-400'
  return value > 0 ? 'text-green-600' : 'text-red-600'
}

function getJudgment(
  changePercent: number | null,
  improvementDirection: 'up' | 'down'
): string {
  if (changePercent === null) return '—'
  if (Math.abs(changePercent) < 1) return '⚪'

  const isPositiveChange = changePercent > 0
  const isImproved =
    (isPositiveChange && improvementDirection === 'up') ||
    (!isPositiveChange && improvementDirection === 'down')

  return isImproved ? '🟢' : '🔴'
}

export default function MetricsTable({
  metrics,
  northStarKpi,
}: MetricsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                指標名
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                Before
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                After
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                変化率
              </th>
              <th className="py-3 pl-3 pr-4 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                判定
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {metrics.map((metric) => {
              const isNorthStar = metric.name === northStarKpi
              return (
                <tr
                  key={metric.name}
                  className={`transition-colors hover:bg-slate-50 ${
                    isNorthStar ? 'bg-indigo-50' : ''
                  }`}
                >
                  <td className="py-3 pl-4 pr-3">
                    <div className="flex items-center gap-2">
                      {isNorthStar && <span title="メインKPI">⭐</span>}
                      <span className="text-sm font-medium text-gray-900">
                        {metric.displayName}
                      </span>
                      {metric.isCustom && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-600">
                          カスタム
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-mono text-gray-600">
                    {formatValue(metric.beforeValue)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-mono text-gray-900">
                    {formatValue(metric.afterValue)}
                  </td>
                  <td
                    className={`px-3 py-3 text-right text-sm font-mono ${getChangeColor(metric.changePercent)}`}
                  >
                    {formatPercent(metric.changePercent)}
                  </td>
                  <td className="py-3 pl-3 pr-4 text-center">
                    {getJudgment(
                      metric.changePercent,
                      metric.improvementDirection
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
