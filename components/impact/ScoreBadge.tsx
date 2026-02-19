interface ScoreBadgeProps {
  score: number | null
  size?: 'sm' | 'lg'
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'bg-gray-100 text-gray-400 border-gray-200'
  if (score <= -2) return 'bg-red-50 text-red-700 border-red-200'
  if (score >= 2) return 'bg-green-50 text-green-700 border-green-200'
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

function formatScore(score: number | null): string {
  if (score === null) return '—'
  if (score > 0) return `+${score}`
  return String(score)
}

export default function ScoreBadge({ score, size = 'sm' }: ScoreBadgeProps) {
  const color = getScoreColor(score)

  if (size === 'lg') {
    return (
      <span className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-2xl font-bold ${color}`}>
        {formatScore(score)}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums ${color}`}>
      {formatScore(score)}
    </span>
  )
}
