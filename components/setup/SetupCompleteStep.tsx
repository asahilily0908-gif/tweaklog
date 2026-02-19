'use client'

import { useTranslation } from '@/lib/i18n/config'
import type { MetricConfig } from './MetricConfigStep'

interface SetupCompleteStepProps {
  data: {
    orgName: string
    projectName: string
    platform: string[]
    northStarKpi: string
    customNorthStarKpi: string
    subKpis: string[]
    csvHeaders: string[]
    columnMappings: Record<string, string>
    metricConfigs: MetricConfig[]
  }
}

const KPI_LABELS: Record<string, string> = {
  conversions: 'Conversions (CV)',
  revenue: 'Revenue',
  cpa: 'CPA',
  roas: 'ROAS',
  cvr: 'CVR',
}

const PLATFORM_LABELS: Record<string, string> = {
  google_ads: 'Google Ads',
  meta: 'Meta',
  tiktok: 'TikTok Ads',
}

export default function SetupCompleteStep({ data }: SetupCompleteStepProps) {
  const { t } = useTranslation()
  const northStarLabel =
    data.northStarKpi === 'custom'
      ? data.customNorthStarKpi
      : KPI_LABELS[data.northStarKpi] ?? data.northStarKpi

  const mappedColumns = Object.entries(data.columnMappings).filter(
    ([, v]) => v !== ''
  )

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-green-50 border border-green-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-900">
              {t('setup.readyToGo')}
            </h3>
            <p className="text-sm text-green-700">
              {t('setup.reviewSettings')}
            </p>
          </div>
        </div>
      </div>

      {/* Organization & Project */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('setup.orgAndProject')}
          </h4>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('setup.organization')}</span>
            <span className="font-medium text-gray-900">{data.orgName || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('setup.project')}</span>
            <span className="font-medium text-gray-900">{data.projectName || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('settings.platforms')}</span>
            <span className="font-medium text-gray-900">
              {data.platform.map((p) => PLATFORM_LABELS[p] ?? p).join(', ') || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('setup.kpiSettings')}
          </h4>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('dashboard.mainKpi')}</span>
            <span className="font-semibold text-blue-600">{northStarLabel}</span>
          </div>
          {data.subKpis.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('settings.subKpis')}</span>
              <span className="font-medium text-gray-900">
                {data.subKpis.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Column Mapping */}
      {mappedColumns.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('setup.columnMappings')} ({mappedColumns.length})
            </h4>
          </div>
          <div className="px-4 py-3 space-y-1">
            {mappedColumns.map(([csv, standard]) => (
              <div key={csv} className="flex justify-between text-sm">
                <span className="font-mono text-gray-500">{csv}</span>
                <span className="font-medium text-gray-900">{standard}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Metrics */}
      {data.metricConfigs.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('setup.derivedMetricsSection')} ({data.metricConfigs.length})
            </h4>
          </div>
          <div className="px-4 py-3 space-y-2">
            {data.metricConfigs.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{m.displayName}</span>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                    {m.formula}
                  </code>
                  <span className="text-xs text-gray-400">
                    {m.improvementDirection === 'up' ? '↑' : '↓'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
