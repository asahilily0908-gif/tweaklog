'use client'

import { getScoreColor } from '@/lib/metrics/score-calculator'

interface ScoreBadgeProps {
  score: number | null
  changePercent?: number
  size?: 'sm' | 'md' | 'lg'
}

function formatScore(score: number | null): string {
  if (score === null) return '—'
  if (score > 0) return `+${score}`
  return String(score)
}

export default function ScoreBadge({
  score,
  changePercent,
  size = 'sm',
}: ScoreBadgeProps) {
  if (score === null) {
    const nullColor = 'bg-gray-100 text-gray-400 border-gray-200'
    if (size === 'lg') {
      return (
        <div
          className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl border ${nullColor}`}
        >
          <span className="text-2xl font-bold">—</span>
        </div>
      )
    }
    if (size === 'md') {
      return (
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${nullColor}`}
        >
          <span className="text-sm font-bold">—</span>
        </div>
      )
    }
    return (
      <span
        className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${nullColor}`}
      >
        —
      </span>
    )
  }

  const color = getScoreColor(score)
  const colorClasses = `${color.bg} ${color.text} ${color.border}`

  if (size === 'lg') {
    return (
      <div
        className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl border ${colorClasses}`}
      >
        <span className="text-2xl font-bold">{formatScore(score)}</span>
        <span className="text-xs">{color.label}</span>
        {changePercent !== undefined && (
          <span className="mt-0.5 text-[10px] opacity-75">
            {changePercent >= 0 ? '+' : ''}
            {changePercent.toFixed(1)}%
          </span>
        )}
      </div>
    )
  }

  if (size === 'md') {
    return (
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorClasses}`}
      >
        <span className="text-sm font-bold">{formatScore(score)}</span>
      </div>
    )
  }

  // sm
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${colorClasses}`}
    >
      {formatScore(score)}
    </span>
  )
}
