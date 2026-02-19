'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import ScoreBadge from '@/components/impact/ScoreBadge'
import { computeImpactForExperiment, type OutcomeRow } from '@/lib/metrics/score-calculator'
import { useTranslation } from '@/lib/i18n/config'

interface Experiment {
  id: string
  title: string | null
  category: string
  platform: string
  campaign: string | null
  before_value: string | null
  after_value: string | null
  reason: string | null
  tags: string[]
  is_ai_highlighted: boolean
  created_at: string
  user_email: string | null
}

interface RecentExperimentsProps {
  experiments: Experiment[]
  projectId: string
  outcomes?: OutcomeRow[]
  northStarKpi?: string
  subKpis?: string[]
  onExperimentClick?: (experiment: Experiment) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  bid: 'Bid',
  creative: 'Creative',
  targeting: 'Targeting',
  budget: 'Budget',
  structure: 'Structure',
}

const CATEGORY_COLORS: Record<string, string> = {
  bid: 'bg-amber-50 text-amber-700 border-amber-200',
  creative: 'bg-purple-50 text-purple-700 border-purple-200',
  targeting: 'bg-blue-50 text-blue-700 border-blue-200',
  budget: 'bg-blue-50 text-blue-700 border-blue-200',
  structure: 'bg-gray-50 text-gray-700 border-gray-200',
}

const PLATFORM_COLORS: Record<string, string> = {
  google_ads: 'text-blue-600',
  meta: 'text-purple-600',
  tiktok: 'text-rose-500',
  yahoo_ads: 'text-red-600',
  microsoft_ads: 'text-teal-600',
  line_ads: 'text-blue-600',
  x_ads: 'text-gray-800',
}

const PLATFORM_LABELS: Record<string, string> = {
  google_ads: 'Google',
  meta: 'Meta',
  tiktok: 'TikTok',
  yahoo_ads: 'Yahoo!',
  microsoft_ads: 'Microsoft',
  line_ads: 'LINE',
  x_ads: 'X',
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function RecentExperiments({
  experiments,
  projectId,
  outcomes,
  northStarKpi,
  subKpis,
  onExperimentClick,
}: RecentExperimentsProps) {
  const scoreMap = useMemo(() => {
    if (!outcomes || !northStarKpi) return null
    const map = new Map<string, number>()
    for (const exp of experiments) {
      const result = computeImpactForExperiment(exp, outcomes, northStarKpi, subKpis ?? [])
      map.set(exp.id, result.score)
    }
    return map
  }, [experiments, outcomes, northStarKpi, subKpis])

  const { t } = useTranslation()

  if (experiments.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center text-center">
        <svg className="h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-400">{t('dashboard.noChangesYet')}</p>
        <p className="text-xs text-gray-300 mt-0.5">{t('dashboard.logFirstChange')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {experiments.map((exp) => {
        const rowContent = (
          <>
            {/* AI highlight indicator */}
            <div className="w-5 shrink-0 text-center">
              {exp.is_ai_highlighted && (
                <span className="text-amber-500" title="AI Highlighted">⚡</span>
              )}
            </div>

            {/* Score badge */}
            {scoreMap && (
              <ScoreBadge score={scoreMap.get(exp.id) ?? null} size="sm" />
            )}

            {/* Category badge */}
            <span
              className={`inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                CATEGORY_COLORS[exp.category] ?? 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {t('experiments.categories.' + exp.category) || exp.category}
            </span>

            {/* Platform */}
            <span className={`shrink-0 text-xs font-medium ${PLATFORM_COLORS[exp.platform] ?? 'text-gray-500'}`}>
              {PLATFORM_LABELS[exp.platform] ?? exp.platform}
            </span>

            {/* Title + Diff */}
            <div className="flex-1 min-w-0">
              {exp.title ? (
                <p className="text-xs font-medium text-gray-900 truncate">{exp.title}</p>
              ) : exp.before_value && exp.after_value ? (
                <p className="text-xs text-gray-700 truncate">
                  <span className="text-red-400 line-through">{exp.before_value}</span>
                  <span className="mx-1 text-gray-300">&rarr;</span>
                  <span className="text-green-600 font-medium">{exp.after_value}</span>
                </p>
              ) : (
                <p className="text-xs text-gray-500 truncate">
                  {exp.reason ?? t('dashboard.noDescription')}
                </p>
              )}
            </div>

            {/* Tags */}
            {exp.tags.length > 0 && (
              <div className="hidden sm:flex gap-1">
                {exp.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="rounded-md border border-gray-150 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Time */}
            <span className="shrink-0 text-[11px] text-gray-400 whitespace-nowrap tabular-nums">
              {timeAgo(exp.created_at)}
            </span>
          </>
        )

        if (onExperimentClick) {
          return (
            <button
              key={exp.id}
              type="button"
              onClick={() => onExperimentClick(exp)}
              className="flex w-full items-center gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-all duration-150 text-left"
            >
              {rowContent}
            </button>
          )
        }

        return (
          <Link
            key={exp.id}
            href={`/app/${projectId}/experiments/${exp.id}`}
            className="flex items-center gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-all duration-150"
          >
            {rowContent}
          </Link>
        )
      })}
    </div>
  )
}
