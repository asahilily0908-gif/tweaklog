'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/config'

export interface MetricConfig {
  name: string
  displayName: string
  formula: string
  improvementDirection: 'up' | 'down'
}

interface MetricConfigStepProps {
  data: {
    metricConfigs: MetricConfig[]
  }
  availableVariables: string[]
  onChange: (data: { metricConfigs: MetricConfig[] }) => void
}

const TEMPLATES: MetricConfig[] = [
  { name: 'ctr', displayName: 'CTR', formula: 'Clicks / Impressions', improvementDirection: 'up' },
  { name: 'cpc', displayName: 'CPC', formula: 'Cost / Clicks', improvementDirection: 'down' },
  { name: 'cvr', displayName: 'CVR', formula: 'Conversions / Clicks', improvementDirection: 'up' },
  { name: 'cpa', displayName: 'CPA', formula: 'Cost / Conversions', improvementDirection: 'down' },
  { name: 'roas', displayName: 'ROAS', formula: 'Revenue / Cost', improvementDirection: 'up' },
]

const FUNCTIONS_REFERENCE = [
  { name: 'IF(cond, true_val, false_val)', example: 'IF(Revenue > 0, Revenue / Cost, 0)' },
  { name: 'SUM(a, b, ...)', example: 'SUM(CV_A, CV_B)' },
  { name: 'AVG(a, b, ...)', example: 'AVG(CPA_Mon, CPA_Tue)' },
  { name: 'MIN(a, b)', example: 'MIN(CPA, 1000)' },
  { name: 'MAX(a, b)', example: 'MAX(ROAS, 0)' },
]

function validateFormula(formula: string): string | null {
  if (!formula.trim()) return 'Formula cannot be empty'
  let parens = 0
  for (const ch of formula) {
    if (ch === '(') parens++
    if (ch === ')') parens--
    if (parens < 0) return 'Unmatched closing parenthesis'
  }
  if (parens !== 0) return 'Unmatched opening parenthesis'
  return null
}

export default function MetricConfigStep({
  data,
  availableVariables,
  onChange,
}: MetricConfigStepProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [editingMetric, setEditingMetric] = useState<MetricConfig>({
    name: '',
    displayName: '',
    formula: '',
    improvementDirection: 'up',
  })
  const [formulaError, setFormulaError] = useState<string | null>(null)
  const [showReference, setShowReference] = useState(false)
  const { t } = useTranslation()

  function toggleTemplate(template: MetricConfig) {
    const exists = data.metricConfigs.some((m) => m.name === template.name)
    if (exists) {
      onChange({
        metricConfigs: data.metricConfigs.filter((m) => m.name !== template.name),
      })
    } else {
      onChange({
        metricConfigs: [...data.metricConfigs, template],
      })
    }
  }

  function addCustomMetric() {
    const error = validateFormula(editingMetric.formula)
    if (error) {
      setFormulaError(error)
      return
    }
    if (!editingMetric.name.trim() || !editingMetric.displayName.trim()) {
      setFormulaError('Name and display name are required')
      return
    }
    onChange({
      metricConfigs: [...data.metricConfigs, { ...editingMetric }],
    })
    setEditingMetric({
      name: '',
      displayName: '',
      formula: '',
      improvementDirection: 'up',
    })
    setFormulaError(null)
    setShowCustom(false)
  }

  function removeMetric(name: string) {
    onChange({
      metricConfigs: data.metricConfigs.filter((m) => m.name !== name),
    })
  }

  const allVariables = [
    'Impressions', 'Clicks', 'Cost', 'Conversions', 'Revenue',
    ...availableVariables.filter(
      (v) => !['Impressions', 'Clicks', 'Cost', 'Conversions', 'Revenue'].includes(v)
    ),
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-600">
          {t('setup.derivedDescription')}
        </p>
      </div>

      {/* Template metrics */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {t('setup.templates')}
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {TEMPLATES.map((tmpl) => {
            const isActive = data.metricConfigs.some((m) => m.name === tmpl.name)
            return (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => toggleTemplate(tmpl)}
                className={`rounded-lg border p-3 text-center transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900">
                  {tmpl.displayName}
                </div>
                <div className="mt-1 text-[10px] text-gray-500 font-mono">
                  {tmpl.formula}
                </div>
                <div className="mt-1 text-[10px] text-gray-400">
                  {tmpl.improvementDirection === 'up' ? t('settings.higherBetter') : t('settings.lowerBetter')}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active metrics list */}
      {data.metricConfigs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t('setup.activeMetrics')} ({data.metricConfigs.length})
          </h3>
          <div className="space-y-2">
            {data.metricConfigs.map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {m.displayName}
                  </span>
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {m.formula}
                  </code>
                  <span className="text-xs text-gray-400">
                    {m.improvementDirection === 'up' ? '↑' : '↓'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMetric(m.name)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom metric editor */}
      {!showCustom ? (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('setup.addCustomMetric')}
        </button>
      ) : (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {t('setup.newCustomMetric')}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowCustom(false)
                setFormulaError(null)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                {t('settings.internalName')}
              </label>
              <input
                type="text"
                value={editingMetric.name}
                onChange={(e) =>
                  setEditingMetric({ ...editingMetric, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })
                }
                placeholder="gross_profit_roas"
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                {t('settings.displayName')}
              </label>
              <input
                type="text"
                value={editingMetric.displayName}
                onChange={(e) =>
                  setEditingMetric({ ...editingMetric, displayName: e.target.value })
                }
                placeholder="Gross Profit ROAS"
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Formula editor */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              {t('settings.formula')}
            </label>
            <textarea
              value={editingMetric.formula}
              onChange={(e) => {
                setEditingMetric({ ...editingMetric, formula: e.target.value })
                setFormulaError(null)
              }}
              rows={2}
              placeholder="(Revenue - COGS) / Cost"
              className={`mt-1 block w-full rounded-md border px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${
                formulaError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {formulaError && (
              <p className="mt-1 text-xs text-red-600">{formulaError}</p>
            )}
          </div>

          {/* Available variables */}
          <div>
            <button
              type="button"
              onClick={() => setShowReference(!showReference)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className={`h-3 w-3 transition-transform ${showReference ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              {t('setup.variablesAndFunctions')}
            </button>
            {showReference && (
              <div className="mt-2 rounded-md bg-white border border-gray-200 p-3 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">{t('setup.variables')}</p>
                  <div className="flex flex-wrap gap-1">
                    {allVariables.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setEditingMetric({
                            ...editingMetric,
                            formula: editingMetric.formula + v,
                          })
                        }
                        className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-mono text-blue-700 hover:bg-blue-200"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">{t('setup.functions')}</p>
                  {FUNCTIONS_REFERENCE.map((f) => (
                    <div key={f.name} className="text-[10px] font-mono text-gray-600">
                      <span className="text-purple-600">{f.name}</span>
                      {' — e.g. '}
                      <span className="text-gray-500">{f.example}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Improvement direction */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('settings.improvementDirection')}
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={editingMetric.improvementDirection === 'up'}
                  onChange={() =>
                    setEditingMetric({ ...editingMetric, improvementDirection: 'up' })
                  }
                  className="text-blue-600"
                />
                <span className="text-gray-700">{t('settings.higherBetter')}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={editingMetric.improvementDirection === 'down'}
                  onChange={() =>
                    setEditingMetric({ ...editingMetric, improvementDirection: 'down' })
                  }
                  className="text-blue-600"
                />
                <span className="text-gray-700">{t('settings.lowerBetter')}</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={addCustomMetric}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {t('setup.addMetricButton')}
          </button>
        </div>
      )}
    </div>
  )
}
