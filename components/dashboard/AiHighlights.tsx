interface AiHighlight {
  id: string
  date: string
  metric_name: string
  change_pct: number | null
  related_experiment_ids: string[]
  summary: string | null
}

interface AiHighlightsProps {
  highlights: AiHighlight[]
}

const METRIC_LABELS: Record<string, string> = {
  revenue: 'Revenue',
  conversions: 'Conversions',
  impressions: 'Impressions',
  clicks: 'Clicks',
  cost: 'Cost',
  cpa: 'CPA',
  cpc: 'CPC',
  roas: 'ROAS',
  cvr: 'CVR',
  ctr: 'CTR',
}

export default function AiHighlights({ highlights }: AiHighlightsProps) {
  if (highlights.length === 0) return null

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50">
          <span className="text-sm" title="AI Highlights">⚡</span>
        </div>
        <h2 className="text-sm font-semibold text-gray-900">AI Highlights</h2>
      </div>
      <div className="space-y-2">
        {highlights.map((h) => (
          <div
            key={h.id}
            className="rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed text-gray-700">{h.summary ?? 'No summary available'}</p>
              {h.change_pct !== null && (
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                    h.change_pct > 0
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {h.change_pct > 0 ? '+' : ''}
                  {h.change_pct.toFixed(1)}%
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              {METRIC_LABELS[h.metric_name] ?? h.metric_name} on{' '}
              {new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
