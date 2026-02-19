'use client'

import { useMemo, useEffect, useState } from 'react'
import { computeImpactForExperiment, type OutcomeRow, type MetricResult } from '@/lib/metrics/score-calculator'
import ScoreBadge from './ScoreBadge'
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
}

interface ImpactCardPanelProps {
  experiment: Experiment
  outcomes: OutcomeRow[]
  northStarKpi: string
  subKpis: string[]
  onClose: () => void
  groupName?: string
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

function formatMetricValue(value: number | null, metricName: string): string {
  if (value === null) return '—'
  switch (metricName) {
    case 'cost':
    case 'cpa':
    case 'cpc':
    case 'revenue':
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    case 'cvr':
    case 'ctr':
      return `${value.toFixed(2)}%`
    case 'roas':
      return `${value.toFixed(2)}x`
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ImpactCardPanel({
  experiment,
  outcomes,
  northStarKpi,
  subKpis,
  onClose,
  groupName,
}: ImpactCardPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const impact = useMemo(
    () => computeImpactForExperiment(experiment, outcomes, northStarKpi, subKpis),
    [experiment, outcomes, northStarKpi, subKpis]
  )

  const hasData = impact.metrics.some((m) => m.beforeAvg !== null || m.afterAvg !== null)
  const platformLabel = experiment.platform === 'google_ads' ? 'Google Ads' : experiment.platform === 'meta' ? 'Meta' : experiment.platform

  function handleClose() {
    setIsVisible(false)
    setTimeout(onClose, 250)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-250 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-full md:max-w-md overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-6">
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-150"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header section */}
          <div className="mb-6 pr-8">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('impact.impactCard')}</p>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[experiment.category] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {t('experiments.categories.' + experiment.category) || experiment.category}
              </span>
              <span className="text-xs font-medium text-gray-500">{platformLabel}</span>
              {groupName && (
                <span className="inline-flex rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  {groupName}
                </span>
              )}
              {experiment.campaign && (
                <span className="text-xs text-gray-400 truncate">{experiment.campaign}</span>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-3">{formatDate(experiment.created_at)}</p>

            {experiment.before_value && experiment.after_value && (
              <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 mb-3">
                <p className="text-sm font-medium">
                  <span className="text-red-400 line-through">{experiment.before_value}</span>
                  <span className="mx-2.5 text-gray-300">&rarr;</span>
                  <span className="text-green-600 font-semibold">{experiment.after_value}</span>
                </p>
              </div>
            )}

            {experiment.reason && (
              <p className="text-xs leading-relaxed text-gray-500">{experiment.reason}</p>
            )}
          </div>

          {/* Score section */}
          <div className="mb-6 flex flex-col items-center rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50/80 to-white p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t('impact.impactScore')}</p>
            <ScoreBadge score={hasData ? impact.score : null} size="lg" />
            {impact.northStarChangePct !== null && (
              <p className="mt-3 text-xs text-gray-500">
                {northStarKpi.toUpperCase()} {t('impact.change')}:{' '}
                <span className={`font-semibold tabular-nums ${impact.northStarChangePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {impact.northStarChangePct >= 0 ? '+' : ''}
                  {impact.northStarChangePct.toFixed(1)}%
                </span>
              </p>
            )}
          </div>

          {/* Metrics comparison */}
          {hasData ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full min-w-[360px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="py-2.5 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 pl-4">{t('impact.metric')}</th>
                    <th className="py-2.5 px-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t('impact.before')}</th>
                    <th className="py-2.5 px-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t('impact.after')}</th>
                    <th className="py-2.5 pl-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400 pr-4">{t('impact.change')}</th>
                  </tr>
                </thead>
                <tbody>
                  {impact.metrics.map((metric, i) => (
                    <tr
                      key={metric.metricName}
                      className={`border-b border-gray-100 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                    >
                      <td className="py-3 pr-3 pl-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-900">{metric.displayName}</span>
                          {i === 0 && (
                            <span className="rounded-full bg-blue-50 border border-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                              {t('dashboard.mainKpi')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-xs tabular-nums text-gray-500">
                        {formatMetricValue(metric.beforeAvg, metric.metricName)}
                      </td>
                      <td className="py-3 px-3 text-right text-xs tabular-nums text-gray-700 font-medium">
                        {formatMetricValue(metric.afterAvg, metric.metricName)}
                      </td>
                      <td className={`py-3 pl-3 pr-4 text-right text-xs font-semibold tabular-nums ${
                        metric.improved === true ? 'text-green-600' : metric.improved === false ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        <span className="inline-flex items-center gap-1">
                          {metric.improved === true && (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                            </svg>
                          )}
                          {metric.improved === false && (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                            </svg>
                          )}
                          {metric.changePct !== null
                            ? `${metric.changePct >= 0 ? '+' : ''}${metric.changePct.toFixed(1)}%`
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
              <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <p className="text-sm font-medium text-gray-500">{t('impact.insufficientData')}</p>
              <p className="mt-1 text-xs text-gray-400">{t('impact.noOutcomesData')}</p>
            </div>
          )}

          {/* Footer */}
          <p className="mt-5 text-center text-[10px] text-gray-400">
            {t('impact.comparingPeriod')}
          </p>
        </div>
      </div>
    </div>
  )
}
