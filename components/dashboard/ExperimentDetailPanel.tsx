'use client'

import { useState, useEffect } from 'react'
import ScoreBadge from '@/components/impact/ScoreBadge'
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

interface ExperimentDetailPanelProps {
  experiments: Experiment[]
  date: string
  impactScores: Map<string, number | null>
  onSelectExperiment: (experiment: Experiment) => void
  onClose: () => void
}

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  bid: 'bg-blue-50 text-blue-700 border-blue-200',
  creative: 'bg-purple-50 text-purple-700 border-purple-200',
  targeting: 'bg-orange-50 text-orange-700 border-orange-200',
  budget: 'bg-green-50 text-green-700 border-green-200',
  structure: 'bg-gray-50 text-gray-700 border-gray-200',
}

const PLATFORM_LABELS: Record<string, string> = {
  google_ads: 'Google Ads',
  meta: 'Meta',
  tiktok: 'TikTok',
  yahoo_ads: 'Yahoo! Ads',
  microsoft_ads: 'Microsoft Ads',
  line_ads: 'LINE Ads',
  x_ads: 'X Ads',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ExperimentDetailPanel({
  experiments,
  date,
  impactScores,
  onSelectExperiment,
  onClose,
}: ExperimentDetailPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

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

          {/* Header */}
          <div className="mb-6 pr-8">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t('experiments.changes')}
            </p>
            <h2 className="text-lg font-bold text-gray-900">{formatDate(date)}</h2>
            <p className="text-xs text-gray-500 mt-1">
              {experiments.length} {experiments.length === 1 ? 'change' : 'changes'}
            </p>
          </div>

          {/* Experiment list */}
          <div className="space-y-3">
            {experiments.map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => onSelectExperiment(exp)}
                className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-150 group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                      CATEGORY_BADGE_STYLES[exp.category] ?? 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {t(`experiments.categories.${exp.category}`) || exp.category}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {PLATFORM_LABELS[exp.platform] ?? exp.platform}
                  </span>
                  {impactScores.has(exp.id) && (
                    <div className="ml-auto">
                      <ScoreBadge score={impactScores.get(exp.id) ?? null} />
                    </div>
                  )}
                </div>

                {exp.title && (
                  <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{exp.title}</p>
                )}

                {exp.before_value && exp.after_value && (
                  <div className="rounded-lg bg-gray-50 px-3 py-2 mb-1">
                    <p className="text-xs">
                      <span className="text-red-400 line-through">{exp.before_value}</span>
                      <span className="mx-1.5 text-gray-300">&rarr;</span>
                      <span className="text-green-600 font-medium">{exp.after_value}</span>
                    </p>
                  </div>
                )}

                {exp.campaign && (
                  <p className="text-[11px] text-gray-400 truncate">{exp.campaign}</p>
                )}

                <p className="text-[11px] text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('impact.impactCard')} &rarr;
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
