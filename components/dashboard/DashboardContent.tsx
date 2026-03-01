'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from '@/lib/i18n/config'
import KpiCard from './KpiCard'
import TimelineChart from './TimelineChart'
import RecentExperiments from './RecentExperiments'
import PlatformFilter from './PlatformFilter'
import CampaignFilter from './CampaignFilter'
import ImpactCardPanel from '@/components/impact/ImpactCardPanel'
import ExperimentDetailPanel from './ExperimentDetailPanel'
import AiHighlights from './AiHighlights'
import { evaluateFormulaSafe as evaluateFormula } from '@/lib/metrics/formula-parser'
import { computeImpactForExperiment } from '@/lib/metrics/score-calculator'
import { usePlan } from '@/lib/plan-context'
import { Sparkles } from 'lucide-react'

interface Project {
  id: string
  name: string
  platform: string[]
  north_star_kpi: string | null
  sub_kpis: string[]
  settings: Record<string, unknown>
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

interface MetricConfig {
  id: string
  name: string
  display_name: string
  formula: string
  improvement_direction: 'up' | 'down'
}

interface AiHighlight {
  id: string
  date: string
  metric_name: string
  change_pct: number | null
  related_experiment_ids: string[]
  summary: string | null
}

interface ExperimentGroup {
  id: string
  name: string
  status: 'testing' | 'steady' | 'completed'
  campaignPatterns: string[]
}

interface Props {
  project: Project
  outcomes: Outcome[]
  experiments: Experiment[]
  metricConfigs: MetricConfig[]
  latestDate: string
  aiHighlights: AiHighlight[]
  experimentGroups: ExperimentGroup[]
}

type DateRange = 7 | 14 | 30 | 90 | 'all'

const PLATFORM_LABELS: Record<string, string> = {
  ALL: 'ALL',
  google_ads: 'Google Ads',
  meta: 'Meta',
  tiktok: 'TikTok',
  yahoo_ads: 'Yahoo! Ads',
  microsoft_ads: 'Microsoft Ads',
  line_ads: 'LINE Ads',
  x_ads: 'X (Twitter) Ads',
}

function aggregateByDate(outcomes: Outcome[]) {
  const map = new Map<string, { impressions: number; clicks: number; cost: number; conversions: number; revenue: number; custom: Record<string, number> }>()

  for (const o of outcomes) {
    const existing = map.get(o.date) ?? { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0, custom: {} }
    existing.impressions += Number(o.impressions)
    existing.clicks += Number(o.clicks)
    existing.cost += Number(o.cost)
    existing.conversions += Number(o.conversions)
    existing.revenue += Number(o.revenue)
    if (o.custom_columns && typeof o.custom_columns === 'object') {
      for (const [key, val] of Object.entries(o.custom_columns)) {
        existing.custom[key] = (existing.custom[key] ?? 0) + (Number(val) || 0)
      }
    }
    map.set(o.date, existing)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }))
}

function computeKpi(northStarKpi: string | null, totals: { impressions: number; clicks: number; cost: number; conversions: number; revenue: number }): { label: string; value: number; format: string } {
  switch (northStarKpi) {
    case 'revenue':
      return { label: 'Revenue', value: totals.revenue, format: 'currency' }
    case 'conversions':
      return { label: 'Conversions', value: totals.conversions, format: 'number' }
    case 'cpa':
      return { label: 'CPA', value: totals.conversions > 0 ? totals.cost / totals.conversions : 0, format: 'currency' }
    case 'roas':
      return { label: 'ROAS', value: totals.cost > 0 ? totals.revenue / totals.cost : 0, format: 'ratio' }
    case 'cvr':
      return { label: 'CVR', value: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0, format: 'percent' }
    default:
      return { label: northStarKpi ?? 'Conversions', value: totals.conversions, format: 'number' }
  }
}

function formatValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'ratio':
      return `${value.toFixed(2)}x`
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }
}

function daysBeforeDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() - days + 1)
  return d.toISOString().split('T')[0]
}

export default function DashboardContent({ project, outcomes, experiments, metricConfigs, latestDate, aiHighlights, experimentGroups }: Props) {
  const { t } = useTranslation()
  const { canUseFeature } = usePlan()
  const canUseCustomMetrics = canUseFeature('custom-metrics')
  const [platform, setPlatform] = useState('ALL')
  const [dateRange, setDateRange] = useState<DateRange>(30)
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [detailPanelExps, setDetailPanelExps] = useState<{ experiments: Experiment[]; date: string } | null>(null)
  const [chartView, setChartView] = useState<string>('default') // 'default' or metric config id
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')

  const selectedGroup = groupFilter !== 'all' ? experimentGroups.find((g) => g.id === groupFilter) : null

  // Derive distinct campaigns from outcomes
  const allCampaigns = useMemo(() => {
    const set = new Set<string | null>()
    for (const o of outcomes) {
      set.add(o.campaign)
    }
    return Array.from(set)
  }, [outcomes])

  const filteredOutcomes = useMemo(() => {
    let filtered = outcomes
    // Filter by date range relative to latest data date
    if (dateRange !== 'all') {
      const startDate = daysBeforeDate(latestDate, dateRange)
      filtered = filtered.filter((o) => o.date >= startDate && o.date <= latestDate)
    }
    // Filter by platform
    if (platform !== 'ALL') {
      filtered = filtered.filter((o) => o.platform === platform)
    }
    // Filter by group campaign patterns
    if (selectedGroup && selectedGroup.campaignPatterns.length > 0) {
      filtered = filtered.filter((o) =>
        o.campaign && selectedGroup.campaignPatterns.some((pat) => o.campaign!.toLowerCase().includes(pat.toLowerCase()))
      )
    }
    // Filter by campaign
    if (selectedCampaign === 'uncategorized') {
      filtered = filtered.filter((o) => o.campaign === null)
    } else if (selectedCampaign !== 'all') {
      filtered = filtered.filter((o) => o.campaign === selectedCampaign)
    }
    return filtered
  }, [outcomes, platform, dateRange, latestDate, selectedGroup, selectedCampaign])

  const dailyData = useMemo(() => aggregateByDate(filteredOutcomes), [filteredOutcomes])

  const totals = useMemo(() => {
    return filteredOutcomes.reduce(
      (acc, o) => {
        acc.impressions += Number(o.impressions)
        acc.clicks += Number(o.clicks)
        acc.cost += Number(o.cost)
        acc.conversions += Number(o.conversions)
        acc.revenue += Number(o.revenue)
        if (o.custom_columns && typeof o.custom_columns === 'object') {
          for (const [key, val] of Object.entries(o.custom_columns)) {
            acc.custom[key] = (acc.custom[key] ?? 0) + (Number(val) || 0)
          }
        }
        return acc
      },
      { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0, custom: {} as Record<string, number> }
    )
  }, [filteredOutcomes])

  // Previous period totals for % change calculation
  const previousTotals = useMemo(() => {
    if (dateRange === 'all') return null
    const days = dateRange as number
    const currentStart = daysBeforeDate(latestDate, days)
    const prevEndDate = new Date(currentStart + 'T00:00:00')
    prevEndDate.setDate(prevEndDate.getDate() - 1)
    const prevEndStr = prevEndDate.toISOString().split('T')[0]
    const prevStartStr = daysBeforeDate(prevEndStr, days)

    let filtered = outcomes.filter((o) => o.date >= prevStartStr && o.date <= prevEndStr)
    if (platform !== 'ALL') {
      filtered = filtered.filter((o) => o.platform === platform)
    }
    if (selectedGroup && selectedGroup.campaignPatterns.length > 0) {
      filtered = filtered.filter((o) =>
        o.campaign && selectedGroup.campaignPatterns.some((pat) => o.campaign!.toLowerCase().includes(pat.toLowerCase()))
      )
    }
    if (selectedCampaign === 'uncategorized') {
      filtered = filtered.filter((o) => o.campaign === null)
    } else if (selectedCampaign !== 'all') {
      filtered = filtered.filter((o) => o.campaign === selectedCampaign)
    }
    if (filtered.length === 0) return null

    return filtered.reduce(
      (acc, o) => {
        acc.impressions += Number(o.impressions)
        acc.clicks += Number(o.clicks)
        acc.cost += Number(o.cost)
        acc.conversions += Number(o.conversions)
        acc.revenue += Number(o.revenue)
        if (o.custom_columns && typeof o.custom_columns === 'object') {
          for (const [key, val] of Object.entries(o.custom_columns)) {
            acc.custom[key] = (acc.custom[key] ?? 0) + (Number(val) || 0)
          }
        }
        return acc
      },
      { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0, custom: {} as Record<string, number> }
    )
  }, [outcomes, platform, dateRange, latestDate, selectedGroup, selectedCampaign])

  // Evaluate custom metrics from metric_configs
  const customMetricValues = useMemo(() => {
    if (metricConfigs.length === 0) return []

    function buildVars(t: typeof totals) {
      return {
        Impressions: t.impressions,
        impressions: t.impressions,
        Clicks: t.clicks,
        clicks: t.clicks,
        Cost: t.cost,
        cost: t.cost,
        Conversions: t.conversions,
        conversions: t.conversions,
        Revenue: t.revenue,
        revenue: t.revenue,
        ...t.custom,
      } as Record<string, number | null>
    }

    const currentVars = buildVars(totals)

    return metricConfigs.map((mc) => {
      const current = evaluateFormula(mc.formula, currentVars)
      let change: number | null = null

      if (previousTotals && current.value !== null) {
        const prevVars = buildVars(previousTotals)
        const prev = evaluateFormula(mc.formula, prevVars)
        if (prev.value !== null && prev.value !== 0) {
          change = ((current.value - prev.value) / Math.abs(prev.value)) * 100
        }
      }

      return {
        id: mc.id,
        name: mc.display_name,
        formula: mc.formula,
        value: current.value,
        change,
        improvementDirection: mc.improvement_direction,
      }
    })
  }, [metricConfigs, totals, previousTotals])

  // Compute impact scores for experiments (used in chart markers)
  const impactScores = useMemo(() => {
    if (!project.north_star_kpi) return new Map<string, number | null>()
    const map = new Map<string, number | null>()
    for (const exp of experiments) {
      const result = computeImpactForExperiment(exp, outcomes, project.north_star_kpi, project.sub_kpis ?? [])
      map.set(exp.id, result.score)
    }
    return map
  }, [experiments, outcomes, project.north_star_kpi, project.sub_kpis])

  const northStar = computeKpi(project.north_star_kpi, totals)
  const isAllMode = platform === 'ALL'

  // Smart formatting for custom metric values
  function formatCustomMetric(name: string, formula: string, value: number): string {
    const upper = name.toUpperCase()
    const formulaUpper = formula.toUpperCase()

    // Rate/ratio metrics that produce 0-1 values → display as percentage
    const isRate = /CTR|CVR|RATE|RATIO/i.test(name) ||
      /CLICKS\s*\/\s*IMPRESSIONS|CONVERSIONS\s*\/\s*CLICKS/i.test(formula)
    if (isRate || (Math.abs(value) > 0 && Math.abs(value) < 1 && !upper.includes('ROAS'))) {
      return `${(value * 100).toFixed(1)}%`
    }

    // ROAS → ratio format
    if (upper.includes('ROAS') || (formulaUpper.includes('REVENUE') && formulaUpper.includes('/ COST'))) {
      return `${value.toFixed(2)}x`
    }

    // Currency metrics
    if (/PROFIT|REVENUE|COST|CPA|CPC|SPEND|LTV|AOV/i.test(name)) {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }

    // Default: number with up to 2 decimal places
    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  // Infer format type for a custom metric
  function inferMetricFormat(name: string, formula: string): 'percent' | 'currency' | 'ratio' | 'number' {
    if (/CTR|CVR|RATE|RATIO/i.test(name) ||
      /CLICKS\s*\/\s*IMPRESSIONS|CONVERSIONS\s*\/\s*CLICKS/i.test(formula)) return 'percent'
    if (/ROAS/i.test(name) || (/REVENUE/i.test(formula) && /\/\s*COST/i.test(formula))) return 'ratio'
    if (/PROFIT|REVENUE|COST|CPA|CPC|SPEND|LTV|AOV/i.test(name)) return 'currency'
    return 'number'
  }

  // Build chart view options
  const chartViewOptions = useMemo(() => {
    const options: { id: string; label: string }[] = [
      { id: 'default', label: `${northStar.label} & Cost` },
    ]
    for (const mc of metricConfigs) {
      options.push({ id: mc.id, label: mc.display_name })
    }
    return options
  }, [metricConfigs, northStar.label])

  // Compute daily chart data with custom metric values when a custom view is selected
  const selectedMetric = chartView !== 'default' ? metricConfigs.find((m) => m.id === chartView) : null

  const chartData = useMemo(() => {
    if (!selectedMetric) return dailyData

    return dailyData.map((day) => {
      const vars: Record<string, number | null> = {
        Impressions: day.impressions,
        impressions: day.impressions,
        Clicks: day.clicks,
        clicks: day.clicks,
        Cost: day.cost,
        cost: day.cost,
        Conversions: day.conversions,
        conversions: day.conversions,
        Revenue: day.revenue,
        revenue: day.revenue,
        ...day.custom,
      }
      const result = evaluateFormula(selectedMetric.formula, vars)
      const fmt = inferMetricFormat(selectedMetric.display_name, selectedMetric.formula)
      // For percent-type metrics (CTR, CVR), multiply by 100 for display
      const value = result.value !== null && fmt === 'percent' ? result.value * 100 : result.value
      return { ...day, _custom: value }
    })
  }, [dailyData, selectedMetric])

  const selectedMetricFormat = selectedMetric
    ? inferMetricFormat(selectedMetric.display_name, selectedMetric.formula)
    : null

  const availablePlatforms = ['ALL', ...project.platform]

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            {t('dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {dateRange === 'all'
              ? t('common.all')
              : `${t('dashboard.lastDays').replace('{days}', String(dateRange))} ${t('dashboard.endingOn').replace('{date}', latestDate)}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex overflow-x-auto rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm p-0.5 shadow-sm hover:shadow-sm transition-shadow">
            {([7, 14, 30, 90, 'all'] as DateRange[]).map((range) => (
              <button
                key={String(range)}
                type="button"
                onClick={() => setDateRange(range)}
                className={`shrink-0 rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  dateRange === range
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {range === 'all' ? 'All' : `${range}d`}
              </button>
            ))}
          </div>
          {experimentGroups.length > 0 && (
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:shadow-sm transition-shadow focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">{t('dashboard.allGroups')}</option>
              {experimentGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
          {allCampaigns.length > 1 && (
            <CampaignFilter
              campaigns={allCampaigns}
              selected={selectedCampaign}
              onChange={setSelectedCampaign}
            />
          )}
          <div className="overflow-x-auto">
            <PlatformFilter
              platforms={availablePlatforms}
              labels={PLATFORM_LABELS}
              selected={platform}
              onChange={setPlatform}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {isAllMode ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={northStar.label}
              value={formatValue(northStar.value, northStar.format)}
              badge={t('dashboard.mainKpi')}
              accentColor="blue"
            />
            <KpiCard
              label="Cost"
              value={formatValue(totals.cost, 'currency')}
              accentColor="gray"
            />
            <KpiCard
              label="CTR"
              value={formatValue(totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0, 'percent')}
            />
            <KpiCard
              label="CVR"
              value={formatValue(totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0, 'percent')}
            />
          </div>
          {customMetricValues.length > 0 && (
            canUseCustomMetrics ? (
              <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {customMetricValues.map((cm) => (
                  <KpiCard
                    key={cm.id}
                    label={cm.name}
                    value={
                      cm.value !== null
                        ? formatCustomMetric(cm.name, cm.formula, cm.value)
                        : '—'
                    }
                    badge={t('dashboard.custom')}
                    accentColor="blue"
                    change={cm.change}
                    improvementDirection={cm.improvementDirection}
                  />
                ))}
              </div>
            ) : (
              <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {customMetricValues.map((cm) => (
                  <a
                    key={cm.id}
                    href={`/app/${project.id}/settings`}
                    className="group relative rounded-xl border border-gray-200 bg-white/60 p-3 sm:p-4 backdrop-blur-sm hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{cm.name}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Pro
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-300">***</div>
                    <p className="mt-1 text-[10px] text-gray-400 group-hover:text-blue-500 transition-colors">Proで解放</p>
                  </a>
                ))}
              </div>
            )
          )}
        </>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Impressions" value={formatValue(totals.impressions, 'number')} />
          <KpiCard label="Clicks" value={formatValue(totals.clicks, 'number')} />
          <KpiCard
            label="CTR"
            value={formatValue(totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0, 'percent')}
          />
          <KpiCard label="Cost" value={formatValue(totals.cost, 'currency')} />
          <KpiCard label="Conversions" value={formatValue(totals.conversions, 'number')} />
          <KpiCard
            label="CVR"
            value={formatValue(totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0, 'percent')}
          />
          <KpiCard
            label="CPC"
            value={formatValue(totals.clicks > 0 ? totals.cost / totals.clicks : 0, 'currency')}
          />
          <KpiCard
            label="CPA"
            value={formatValue(totals.conversions > 0 ? totals.cost / totals.conversions : 0, 'currency')}
          />
          <KpiCard
            label="ROAS"
            value={formatValue(totals.cost > 0 ? totals.revenue / totals.cost : 0, 'ratio')}
          />
          <KpiCard label="Revenue" value={formatValue(totals.revenue, 'currency')} />
        </div>
      )}

      {/* Timeline Chart */}
      <div className="mb-6 rounded-xl border-0 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
          <h2 className="text-sm font-semibold text-gray-900">
            {selectedMetric ? selectedMetric.display_name : isAllMode ? `${northStar.label} & Cost` : 'Performance Trend'}
          </h2>
          {isAllMode && chartViewOptions.length > 1 && (
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 overflow-x-auto">
              {chartViewOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setChartView(opt.id)}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150 whitespace-nowrap ${
                    chartView === opt.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="mb-4 text-xs text-gray-400">{t('dashboard.dailyMetrics')}</p>
        {dailyData.length > 0 ? (
          <div className="overflow-x-auto -mx-2 px-2">
          <div className="min-w-[480px]">
          <TimelineChart
            data={chartData}
            northStarKey={isAllMode ? (project.north_star_kpi ?? 'conversions') : undefined}
            isAllMode={isAllMode}
            experiments={experiments}
            onExperimentClick={(chartExps, date) => {
              const fullExps = chartExps
                .map((ce) => experiments.find((e) => e.id === ce.id))
                .filter((e): e is Experiment => !!e)
              if (fullExps.length === 1) {
                setSelectedExperiment(fullExps[0])
              } else if (fullExps.length > 1) {
                setDetailPanelExps({ experiments: fullExps, date })
              }
            }}
            customMetricLine={selectedMetric ? {
              label: selectedMetric.display_name,
              format: selectedMetricFormat!,
            } : undefined}
            impactScores={impactScores}
          />
          </div>
          </div>
        ) : (
          <div className="flex h-72 flex-col items-center justify-center text-center">
            <svg className="h-10 w-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="text-sm text-gray-400">No data yet</p>
            <p className="text-xs text-gray-300 mt-0.5">Import a CSV to get started</p>
          </div>
        )}
      </div>

      {/* Recent Experiments */}
      <div className="rounded-xl border-0 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{t('dashboard.recentChanges')}</h2>
          <a
            href={`/app/${project.id}/experiments`}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {t('common.viewAll')} &rarr;
          </a>
        </div>
        <RecentExperiments
          experiments={experiments}
          projectId={project.id}
          outcomes={outcomes}
          northStarKpi={project.north_star_kpi ?? undefined}
          subKpis={project.sub_kpis}
          onExperimentClick={setSelectedExperiment}
        />
      </div>

      {/* AI Highlights */}
      {aiHighlights.length > 0 && (
        <div className="mt-6">
          <AiHighlights highlights={aiHighlights} />
        </div>
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

      {/* Experiment Detail Panel (multi-experiment date) */}
      {detailPanelExps && (
        <ExperimentDetailPanel
          experiments={detailPanelExps.experiments}
          date={detailPanelExps.date}
          impactScores={impactScores}
          onSelectExperiment={(exp) => {
            setDetailPanelExps(null)
            setSelectedExperiment(exp)
          }}
          onClose={() => setDetailPanelExps(null)}
        />
      )}
    </div>
  )
}
