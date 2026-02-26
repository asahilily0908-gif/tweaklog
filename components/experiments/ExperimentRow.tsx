'use client'

import { Zap } from 'lucide-react'
import ScoreBadge from '@/components/impact/ScoreBadge'
import CategoryBadge from './CategoryBadge'
import DiffDisplay from './DiffDisplay'
import BatchBadge from './BatchBadge'

interface ExperimentRowProps {
  experiment: {
    id: string
    category: 'bid' | 'creative' | 'targeting' | 'budget' | 'structure'
    platform: string
    campaign?: string
    beforeValue?: string
    afterValue?: string
    reason?: string
    tags?: string[]
    batchId?: string
    batchCount?: number
    score?: number
    isAiHighlighted?: boolean
    createdAt: string
    userName?: string
  }
  onClick?: (id: string) => void
  showScores?: boolean
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hours}:${minutes}`
}

export default function ExperimentRow({
  experiment,
  onClick,
  showScores = true,
}: ExperimentRowProps) {
  const highlighted = experiment.isAiHighlighted

  return (
    <div
      className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-sm ${
        highlighted ? 'border-l-4 border-l-amber-400' : ''
      }`}
      onClick={() => onClick?.(experiment.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.(experiment.id)
      }}
    >
      <div className="flex items-start gap-4">
        {/* Score badge (left) */}
        {showScores && experiment.score != null && (
          <div className="shrink-0">
            <ScoreBadge score={experiment.score} size="md" />
          </div>
        )}

        {/* Content (center) */}
        <div className="min-w-0 flex-1">
          {/* Row 1: Category + Platform + AI badge + Date */}
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={experiment.category} />
            <span className="text-xs text-slate-400">
              {experiment.platform}
            </span>
            {highlighted && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600">
                <Zap className="h-3 w-3" />
                AI検知
              </span>
            )}
            <span className="ml-auto text-xs text-slate-400">
              {formatDateTime(experiment.createdAt)}
            </span>
          </div>

          {/* Row 2: Diff */}
          {(experiment.beforeValue || experiment.afterValue) && (
            <div className="mt-1.5">
              <DiffDisplay
                before={experiment.beforeValue}
                after={experiment.afterValue}
              />
            </div>
          )}

          {/* Row 3: Campaign */}
          {experiment.campaign && (
            <p className="mt-1 text-sm text-slate-500">
              {experiment.campaign}
            </p>
          )}

          {/* Row 4: Reason */}
          {experiment.reason && (
            <p className="mt-1 text-sm italic text-slate-600">
              {experiment.reason}
            </p>
          )}

          {/* Row 5: Tags */}
          {experiment.tags && experiment.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {experiment.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Batch badge (right) */}
        {experiment.batchId && (
          <div className="shrink-0">
            <BatchBadge count={experiment.batchCount} />
          </div>
        )}
      </div>
    </div>
  )
}
