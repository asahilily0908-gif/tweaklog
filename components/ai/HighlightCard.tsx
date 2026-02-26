'use client'

import { Zap } from 'lucide-react'

interface HighlightCardProps {
  highlight: {
    date: string
    metricName: string
    changePercent: number
    severity: 'warning' | 'critical'
    summary?: string
    relatedExperimentIds?: string[]
  }
  onClick?: () => void
}

export default function HighlightCard({
  highlight,
  onClick,
}: HighlightCardProps) {
  const isCritical = highlight.severity === 'critical'
  const borderColor = isCritical ? 'border-l-red-500' : 'border-l-amber-500'
  const iconColor = isCritical ? 'text-red-500' : 'text-amber-500'
  const isPositive = highlight.changePercent >= 0

  return (
    <div
      className={`cursor-pointer rounded-lg border border-gray-200 border-l-4 ${borderColor} bg-white p-4 transition-all hover:shadow-md`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.()
      }}
    >
      {/* Header: icon + date */}
      <div className="flex items-center gap-2">
        <Zap className={`h-4 w-4 ${iconColor}`} />
        <span className="text-sm text-slate-500">{highlight.date}</span>
      </div>

      {/* Metric name + change percent */}
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-base font-semibold text-slate-900">
          {highlight.metricName}
        </span>
        <span
          className={`text-lg font-bold ${
            isPositive ? 'text-red-600' : 'text-blue-600'
          }`}
        >
          {isPositive ? '▲' : '▼'}{' '}
          {isPositive ? '+' : ''}
          {highlight.changePercent.toFixed(1)}%
        </span>
      </div>

      {/* Summary */}
      {highlight.summary && (
        <p className="mt-2 text-sm text-slate-600">{highlight.summary}</p>
      )}

      {/* Related experiments */}
      {highlight.relatedExperimentIds &&
        highlight.relatedExperimentIds.length > 0 && (
          <p className="mt-2 text-xs text-slate-400">
            関連する変更: {highlight.relatedExperimentIds.length}件
          </p>
        )}
    </div>
  )
}
