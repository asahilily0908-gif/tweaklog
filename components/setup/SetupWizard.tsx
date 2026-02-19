'use client'

import { useState } from 'react'
import NorthStarKpiStep from './NorthStarKpiStep'
import ColumnMappingStep from './ColumnMappingStep'
import MetricConfigStep, { type MetricConfig } from './MetricConfigStep'
import SetupCompleteStep from './SetupCompleteStep'
import { completeSetup } from '@/app/(app)/setup/actions'
import { useTranslation } from '@/lib/i18n/config'

export interface WizardData {
  // Step 1
  orgName: string
  projectName: string
  platform: string[]
  northStarKpi: string
  customNorthStarKpi: string
  subKpis: string[]
  // Step 2
  csvHeaders: string[]
  csvPreview: string[][]
  columnMappings: Record<string, string>
  // Step 3
  metricConfigs: MetricConfig[]
}

// STEPS is defined inside the component to access t()

export default function SetupWizard() {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const STEPS = [
    { title: t('setup.mainKpiStep'), description: t('setup.mainKpiStepDesc') },
    { title: t('setup.dataMappingStep'), description: t('setup.dataMappingStepDesc') },
    { title: t('setup.derivedMetricsStep'), description: t('setup.derivedMetricsStepDesc') },
    { title: t('setup.completeStep'), description: t('setup.completeStepDesc') },
  ]

  const [data, setData] = useState<WizardData>({
    orgName: '',
    projectName: '',
    platform: [],
    northStarKpi: '',
    customNorthStarKpi: '',
    subKpis: [],
    csvHeaders: [],
    csvPreview: [],
    columnMappings: {},
    metricConfigs: [],
  })

  function updateData(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return (
          data.orgName.trim() !== '' &&
          data.projectName.trim() !== '' &&
          data.northStarKpi !== '' &&
          (data.northStarKpi !== 'custom' || data.customNorthStarKpi.trim() !== '')
        )
      case 1:
        return true // CSV mapping is optional
      case 2:
        return true // Metrics are optional
      case 3:
        return true
      default:
        return false
    }
  }

  async function handleComplete() {
    setSaving(true)
    setError(null)

    const result = await completeSetup({
      orgName: data.orgName,
      projectName: data.projectName,
      platform: data.platform,
      northStarKpi:
        data.northStarKpi === 'custom'
          ? data.customNorthStarKpi
          : data.northStarKpi,
      subKpis: data.subKpis,
      columnMappings: data.columnMappings,
      metricConfigs: data.metricConfigs,
    })

    if (result?.error) {
      setError(result.error)
      setSaving(false)
    }
    // On success, the server action redirects to /app/[project]/dashboard
  }

  // Derive available variables from mapped CSV columns
  const availableVariables = data.csvHeaders.filter(
    (h) => data.columnMappings[h] !== ''
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('setup.setupProject')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {STEPS[step].description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    i < step
                      ? 'bg-blue-600 text-white'
                      : i === step
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i < step ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-12 sm:w-24 md:w-32 ${
                      i < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={`text-xs ${
                  i <= step ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {s.title}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {step === 0 && (
            <NorthStarKpiStep
              data={{
                orgName: data.orgName,
                projectName: data.projectName,
                platform: data.platform,
                northStarKpi: data.northStarKpi,
                customNorthStarKpi: data.customNorthStarKpi,
                subKpis: data.subKpis,
              }}
              onChange={updateData}
            />
          )}
          {step === 1 && (
            <ColumnMappingStep
              data={{
                csvHeaders: data.csvHeaders,
                csvPreview: data.csvPreview,
                columnMappings: data.columnMappings,
              }}
              onChange={updateData}
            />
          )}
          {step === 2 && (
            <MetricConfigStep
              data={{ metricConfigs: data.metricConfigs }}
              availableVariables={availableVariables}
              onChange={updateData}
            />
          )}
          {step === 3 && <SetupCompleteStep data={data} />}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.back')}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('common.next')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? t('setup.settingUp') : t('setup.completeSetup')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
