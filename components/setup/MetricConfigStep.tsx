'use client'

import { useState } from 'react'
import type { WizardData } from './SetupWizard'

export interface MetricConfig {
  name: string
  displayName: string
  formula: string
  improvementDirection: 'up' | 'down'
}

interface MetricConfigStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
}

const TEMPLATES: MetricConfig[] = [
  {
    name: 'ctr',
    displayName: 'CTR',
    formula: 'Clicks / Impressions',
    improvementDirection: 'up',
  },
  {
    name: 'cpc',
    displayName: 'CPC',
    formula: 'Cost / Clicks',
    improvementDirection: 'down',
  },
  {
    name: 'cvr',
    displayName: 'CVR',
    formula: 'Conversions / Clicks',
    improvementDirection: 'up',
  },
  {
    name: 'cpa',
    displayName: 'CPA',
    formula: 'Cost / Conversions',
    improvementDirection: 'down',
  },
  {
    name: 'roas',
    displayName: 'ROAS',
    formula: 'Revenue / Cost',
    improvementDirection: 'up',
  },
]

export default function MetricConfigStep({
  data,
  onChange,
}: MetricConfigStepProps) {
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customMetric, setCustomMetric] = useState<MetricConfig>({
    name: '',
    displayName: '',
    formula: '',
    improvementDirection: 'up',
  })

  function toggleTemplate(template: MetricConfig) {
    const exists = data.metricConfigs.some((m) => m.name === template.name)
    if (exists) {
      onChange({
        metricConfigs: data.metricConfigs.filter(
          (m) => m.name !== template.name
        ),
      })
    } else {
      onChange({
        metricConfigs: [...data.metricConfigs, template],
      })
    }
  }

  function addCustomMetric() {
    if (
      !customMetric.name.trim() ||
      !customMetric.displayName.trim() ||
      !customMetric.formula.trim()
    )
      return
    onChange({
      metricConfigs: [...data.metricConfigs, { ...customMetric }],
    })
    setCustomMetric({
      name: '',
      displayName: '',
      formula: '',
      improvementDirection: 'up',
    })
    setShowCustomForm(false)
  }

  function removeCustomMetric(name: string) {
    onChange({
      metricConfigs: data.metricConfigs.filter((m) => m.name !== name),
    })
  }

  const customMetrics = data.metricConfigs.filter(
    (m) => !TEMPLATES.some((t) => t.name === m.name)
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          分析に使う指標を設定しましょう
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          テンプレートから選ぶか、カスタム数式で自由に定義できます。
        </p>
      </div>

      {/* Templates */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TEMPLATES.map((tmpl) => {
          const isActive = data.metricConfigs.some(
            (m) => m.name === tmpl.name
          )
          return (
            <button
              key={tmpl.name}
              type="button"
              onClick={() => toggleTemplate(tmpl)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-sm font-semibold text-gray-900">
                {tmpl.displayName}
              </div>
              <div className="mt-1 text-xs font-mono text-gray-500">
                {tmpl.formula}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {tmpl.improvementDirection === 'up'
                  ? '↑高いほど良い'
                  : '↓低いほど良い'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Custom metrics list */}
      {customMetrics.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">
            追加済みカスタム指標
          </h3>
          {customMetrics.map((m) => (
            <div
              key={m.name}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">
                  {m.displayName}
                </span>
                <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                  {m.formula}
                </code>
                <span className="text-xs text-gray-400">
                  {m.improvementDirection === 'up' ? '↑' : '↓'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeCustomMetric(m.name)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom metric form */}
      {!showCustomForm ? (
        <button
          type="button"
          onClick={() => setShowCustomForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all duration-200"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          カスタム指標を追加
        </button>
      ) : (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                指標名
              </label>
              <input
                type="text"
                value={customMetric.name}
                onChange={(e) =>
                  setCustomMetric({
                    ...customMetric,
                    name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  })
                }
                placeholder='例: gross_profit_roas'
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                表示名
              </label>
              <input
                type="text"
                value={customMetric.displayName}
                onChange={(e) =>
                  setCustomMetric({
                    ...customMetric,
                    displayName: e.target.value,
                  })
                }
                placeholder='例: 粗利ROAS'
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              数式
            </label>
            <textarea
              value={customMetric.formula}
              onChange={(e) =>
                setCustomMetric({
                  ...customMetric,
                  formula: e.target.value,
                })
              }
              rows={2}
              placeholder="例: (Revenue - COGS) / Cost"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              改善方向
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  checked={customMetric.improvementDirection === 'up'}
                  onChange={() =>
                    setCustomMetric({
                      ...customMetric,
                      improvementDirection: 'up',
                    })
                  }
                  className="text-indigo-600"
                />
                ↑高いほど良い
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  checked={customMetric.improvementDirection === 'down'}
                  onChange={() =>
                    setCustomMetric({
                      ...customMetric,
                      improvementDirection: 'down',
                    })
                  }
                  className="text-indigo-600"
                />
                ↓低いほど良い
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addCustomMetric}
              disabled={
                !customMetric.name.trim() ||
                !customMetric.displayName.trim() ||
                !customMetric.formula.trim()
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              追加
            </button>
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
