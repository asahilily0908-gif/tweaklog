'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/config'

interface NorthStarKpiStepProps {
  data: {
    orgName: string
    projectName: string
    platform: string[]
    northStarKpi: string
    customNorthStarKpi: string
    subKpis: string[]
  }
  onChange: (data: Partial<NorthStarKpiStepProps['data']>) => void
}

const KPI_PRESETS = [
  { value: 'conversions', label: 'Conversions (CV)', description: 'Total conversion count' },
  { value: 'revenue', label: 'Revenue', description: 'Total revenue / sales' },
  { value: 'cpa', label: 'CPA', description: 'Cost per acquisition' },
  { value: 'roas', label: 'ROAS', description: 'Return on ad spend' },
  { value: 'cvr', label: 'CVR', description: 'Conversion rate' },
  { value: 'custom', label: 'Custom', description: 'Define your own KPI' },
]

const SUB_KPI_OPTIONS = [
  'Impressions', 'Clicks', 'CTR', 'CPC', 'Cost',
  'Conversions', 'CVR', 'CPA', 'ROAS', 'Revenue',
]

const PLATFORM_OPTIONS = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'meta', label: 'Meta (Facebook/Instagram)' },
  { value: 'tiktok', label: 'TikTok Ads' },
  { value: 'yahoo_ads', label: 'Yahoo! Ads' },
  { value: 'microsoft_ads', label: 'Microsoft Ads' },
  { value: 'line_ads', label: 'LINE Ads' },
  { value: 'x_ads', label: 'X (Twitter) Ads' },
]

const PRESET_PLATFORM_VALUES = new Set(PLATFORM_OPTIONS.map((p) => p.value))

export default function NorthStarKpiStep({
  data,
  onChange,
}: NorthStarKpiStepProps) {
  const [customPlatformInput, setCustomPlatformInput] = useState('')
  const { t } = useTranslation()

  function togglePlatform(platform: string) {
    const next = data.platform.includes(platform)
      ? data.platform.filter((p) => p !== platform)
      : [...data.platform, platform]
    onChange({ platform: next })
  }

  function addCustomPlatform() {
    const name = customPlatformInput.trim()
    if (!name) return
    const value = name.toLowerCase().replace(/\s+/g, '_')
    if (!data.platform.includes(value)) {
      onChange({ platform: [...data.platform, value] })
    }
    setCustomPlatformInput('')
  }

  function toggleSubKpi(kpi: string) {
    if (data.subKpis.includes(kpi)) {
      onChange({ subKpis: data.subKpis.filter((k) => k !== kpi) })
    } else if (data.subKpis.length < 5) {
      onChange({ subKpis: [...data.subKpis, kpi] })
    }
  }

  return (
    <div className="space-y-8">
      {/* Organization & Project Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {t('setup.orgAndProject')}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">
              {t('settings.organizationName')}
            </label>
            <input
              id="orgName"
              type="text"
              value={data.orgName}
              onChange={(e) => onChange({ orgName: e.target.value })}
              placeholder={t('setup.orgPlaceholder')}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
              {t('settings.projectName')}
            </label>
            <input
              id="projectName"
              type="text"
              value={data.projectName}
              onChange={(e) => onChange({ projectName: e.target.value })}
              placeholder={t('setup.projectPlaceholder')}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.platforms')}
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => togglePlatform(p.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  data.platform.includes(p.value)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom platforms */}
          {data.platform.filter((p) => !PRESET_PLATFORM_VALUES.has(p)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.platform.filter((p) => !PRESET_PLATFORM_VALUES.has(p)).map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-500 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                >
                  {p}
                  <button
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className="ml-0.5 text-blue-400 hover:text-red-500"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add custom platform */}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={customPlatformInput}
              onChange={(e) => setCustomPlatformInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomPlatform() } }}
              placeholder={t('setup.otherPlatformPlaceholder')}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addCustomPlatform}
              disabled={!customPlatformInput.trim()}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('common.add')}
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {t('setup.selectMainKpi')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('setup.mainKpiSelectDescription')}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {KPI_PRESETS.map((kpi) => (
            <button
              key={kpi.value}
              type="button"
              onClick={() => onChange({ northStarKpi: kpi.value })}
              className={`rounded-lg border p-4 text-left transition-colors ${
                data.northStarKpi === kpi.value
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium text-gray-900">
                {kpi.label}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {kpi.description}
              </div>
            </button>
          ))}
        </div>

        {data.northStarKpi === 'custom' && (
          <input
            type="text"
            value={data.customNorthStarKpi}
            onChange={(e) => onChange({ customNorthStarKpi: e.target.value })}
            placeholder={t('setup.customKpiPlaceholder')}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Sub KPIs */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {t('setup.subKpisUpTo5')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {SUB_KPI_OPTIONS.map((kpi) => (
            <button
              key={kpi}
              type="button"
              onClick={() => toggleSubKpi(kpi)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                data.subKpis.includes(kpi)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              } ${
                !data.subKpis.includes(kpi) && data.subKpis.length >= 5
                  ? 'opacity-40 cursor-not-allowed'
                  : ''
              }`}
              disabled={!data.subKpis.includes(kpi) && data.subKpis.length >= 5}
            >
              {kpi}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {data.subKpis.length}/5 {t('settings.selected')}
        </p>
      </div>
    </div>
  )
}
