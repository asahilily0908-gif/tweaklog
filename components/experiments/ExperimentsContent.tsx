'use client'

import { useState, useMemo } from 'react'
import NewChangeModal from './NewChangeModal'
import ScoreBadge from '@/components/impact/ScoreBadge'
import ImpactCardPanel from '@/components/impact/ImpactCardPanel'
import { computeImpactForExperiment, type OutcomeRow } from '@/lib/metrics/score-calculator'
import { useTranslation } from '@/lib/i18n/config'
import { usePlan } from '@/lib/plan-context'

interface Project {
  id: string
  name: string
  platform: string[]
  north_star_kpi: string | null
  sub_kpis: string[]
}

interface Experiment {
  id: string
  title: string | null
  category: string
  platform: string
  campaign: string | null
  before_value: string | null
  after_value: string | null
  reason: string | null
  internal_note: string | null
  client_note: string | null
  tags: string[]
  is_ai_highlighted: boolean
  created_at: string
}

interface Outcome {
  id: string
  date: string
  platform: string
  campaign: string | null
  impressions: number
  clicks: number
  cost: number
  conversions: number
  revenue: number
  custom_columns: Record<string, number>
}

interface ExperimentGroup {
  id: string
  name: string
  status: 'testing' | 'steady' | 'completed'
  campaignPatterns: string[]
}

interface Props {
  project: Project
  experiments: Experiment[]
  outcomes: Outcome[]
  experimentGroups: ExperimentGroup[]
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ExperimentsContent({ project, experiments, outcomes, experimentGroups }: Props) {
  const { t } = useTranslation()
  const { plan } = usePlan()
  const [showModal, setShowModal] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)

  // Free plan: 10 experiments per month limit
  const FREE_MONTHLY_LIMIT = 10
  const thisMonthCount = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    return experiments.filter((e) => e.created_at >= monthStart).length
  }, [experiments])
  const isAtLimit = plan === 'free' && thisMonthCount >= FREE_MONTHLY_LIMIT

  const scoreMap = useMemo(() => {
    if (!project.north_star_kpi) return null
    const map = new Map<string, number>()
    for (const exp of experiments) {
      const result = computeImpactForExperiment(exp, outcomes, project.north_star_kpi, project.sub_kpis ?? [])
      map.set(exp.id, result.score)
    }
    return map
  }, [experiments, outcomes, project.north_star_kpi, project.sub_kpis])

  const selectedGroup = filterGroup !== 'all' ? experimentGroups.find((g) => g.id === filterGroup) : null

  const filtered = experiments.filter((e) => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false
    if (selectedGroup && selectedGroup.campaignPatterns.length > 0) {
      if (!e.campaign || !selectedGroup.campaignPatterns.some((pat) => e.campaign!.toLowerCase().includes(pat.toLowerCase()))) {
        return false
      }
    }
    return true
  })

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('experiments.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{experiments.length} {t('experiments.changesRecorded')}</p>
        </div>
        <button
          type="button"
          onClick={() => !isAtLimit && setShowModal(true)}
          disabled={isAtLimit}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 ${
            isAtLimit
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('experiments.logChange')}
        </button>
      </div>

      {/* Free plan experiment limit banner */}
      {isAtLimit && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">{t('upgrade.experimentLimit')}</p>
            <p className="text-xs text-amber-600 mt-0.5">{t('upgrade.experimentLimitCta')}</p>
          </div>
          <a
            href={`/app/${project.id}/settings`}
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
          >
            {t('upgrade.cta')}
          </a>
        </div>
      )}

      {/* Filters */}
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {['all', 'bid', 'creative', 'targeting', 'budget', 'structure'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                filterCategory === cat
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {t('experiments.categories.' + cat)}
            </button>
          ))}
        </div>
        {experimentGroups.length > 0 && (
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="all">{t('dashboard.allGroups')}</option>
            {experimentGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-16 text-center shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-500">{t('experiments.noChanges')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('experiments.startTracking')}</p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t('experiments.logFirstChange')}
          </button>
        </div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="space-y-3 md:hidden">
            {filtered.map((exp) => (
              <div
                key={exp.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedExperiment(exp)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {scoreMap && <ScoreBadge score={scoreMap.get(exp.id) ?? null} size="sm" />}
                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[exp.category] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {t('experiments.categories.' + exp.category) || exp.category}
                    </span>
                    {exp.is_ai_highlighted && <span className="text-amber-500" title="AI Highlighted">⚡</span>}
                  </div>
                  <span className="text-[11px] text-gray-400 tabular-nums">{formatDate(exp.created_at)}</span>
                </div>
                {exp.title && (
                  <p className="text-sm font-medium text-gray-900 mb-1">{exp.title}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium">{exp.platform === 'google_ads' ? 'Google Ads' : exp.platform === 'meta' ? 'Meta' : exp.platform}</span>
                  {exp.before_value && exp.after_value && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-red-400 line-through">{exp.before_value}</span>
                      <span className="text-gray-300">&rarr;</span>
                      <span className="text-green-600 font-medium">{exp.after_value}</span>
                    </>
                  )}
                </div>
                {exp.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {exp.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-md border border-gray-150 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500">
                        {tag}
                      </span>
                    ))}
                    {exp.tags.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{exp.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table layout */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="w-8 px-4 py-3" />
                  {scoreMap && (
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('experiments.score')}</th>
                  )}
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('experiments.category')}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('experiments.platform')}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('experiments.change')}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('experiments.reason')}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('experiments.tags')}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('experiments.date')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp, i) => (
                  <tr
                    key={exp.id}
                    className={`border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-all duration-100 cursor-pointer ${
                      i % 2 === 1 ? 'bg-gray-50/30' : ''
                    }`}
                    onClick={() => setSelectedExperiment(exp)}
                  >
                    <td className="px-4 py-3.5 text-center">
                      {exp.is_ai_highlighted && <span className="text-amber-500" title="AI Highlighted">⚡</span>}
                    </td>
                    {scoreMap && (
                      <td className="px-4 py-3.5">
                        <ScoreBadge score={scoreMap.get(exp.id) ?? null} size="sm" />
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[exp.category] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {t('experiments.categories.' + exp.category) || exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-gray-600 whitespace-nowrap">
                      {exp.platform === 'google_ads' ? 'Google Ads' : exp.platform === 'meta' ? 'Meta' : exp.platform}
                    </td>
                    <td className="px-4 py-3.5">
                      {exp.before_value && exp.after_value ? (
                        <span className="text-xs whitespace-nowrap">
                          <span className="text-red-400 line-through">{exp.before_value}</span>
                          <span className="mx-1 text-gray-300">&rarr;</span>
                          <span className="text-green-600 font-medium">{exp.after_value}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="max-w-[200px] px-4 py-3.5">
                      <p className="text-xs text-gray-500 truncate">{exp.reason ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 whitespace-nowrap">
                        {exp.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-md border border-gray-150 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500">
                            {tag}
                          </span>
                        ))}
                        {exp.tags.length > 2 && (
                          <span className="text-[10px] text-gray-400">+{exp.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap tabular-nums">
                      {formatDate(exp.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {/* New Change Modal */}
      {showModal && (
        <NewChangeModal
          projectId={project.id}
          platforms={project.platform}
          groups={experimentGroups}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Impact Card Panel */}
      {selectedExperiment && project.north_star_kpi && (
        <ImpactCardPanel
          experiment={selectedExperiment}
          outcomes={outcomes}
          northStarKpi={project.north_star_kpi}
          subKpis={project.sub_kpis}
          onClose={() => setSelectedExperiment(null)}
        />
      )}
    </div>
  )
}
