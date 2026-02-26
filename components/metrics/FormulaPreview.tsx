'use client'

import { useMemo } from 'react'
import { evaluateFormula } from '@/lib/metrics/formula-parser'

interface FormulaPreviewProps {
  formula: string
  sampleData?: Array<{
    date: string
    variables: Record<string, number | null>
  }>
}

const DEFAULT_SAMPLE = [
  {
    date: '2026-02-20',
    variables: {
      Impressions: 10000,
      Clicks: 350,
      Cost: 50000,
      Conversions: 25,
      Revenue: 150000,
    },
  },
  {
    date: '2026-02-21',
    variables: {
      Impressions: 12000,
      Clicks: 400,
      Cost: 55000,
      Conversions: 30,
      Revenue: 180000,
    },
  },
  {
    date: '2026-02-22',
    variables: {
      Impressions: 9500,
      Clicks: 320,
      Cost: 48000,
      Conversions: 22,
      Revenue: 130000,
    },
  },
  {
    date: '2026-02-23',
    variables: {
      Impressions: 11000,
      Clicks: 380,
      Cost: 52000,
      Conversions: 28,
      Revenue: 165000,
    },
  },
  {
    date: '2026-02-24',
    variables: {
      Impressions: 13000,
      Clicks: 450,
      Cost: 60000,
      Conversions: 35,
      Revenue: 200000,
    },
  },
  {
    date: '2026-02-25',
    variables: {
      Impressions: 10500,
      Clicks: 360,
      Cost: 51000,
      Conversions: 26,
      Revenue: 155000,
    },
  },
  {
    date: '2026-02-26',
    variables: {
      Impressions: 11500,
      Clicks: 390,
      Cost: 54000,
      Conversions: 29,
      Revenue: 170000,
    },
  },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1000) {
    return v.toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })
  }
  if (Number.isInteger(v)) return String(v)
  return v.toFixed(2)
}

interface EvalResult {
  date: string
  value: number | null
  error: string | null
}

export default function FormulaPreview({
  formula,
  sampleData,
}: FormulaPreviewProps) {
  const data = sampleData ?? DEFAULT_SAMPLE

  const results: EvalResult[] = useMemo(() => {
    if (!formula.trim()) return []

    return data.map((row) => {
      try {
        const value = evaluateFormula(formula, row.variables)
        return { date: row.date, value, error: null }
      } catch (e) {
        return {
          date: row.date,
          value: null,
          error: e instanceof Error ? e.message : 'Error',
        }
      }
    })
  }, [formula, data])

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-slate-400">
          数式を入力するとプレビューが表示されます
        </p>
      </div>
    )
  }

  const hasError = results.some((r) => r.error)
  const numericValues = results
    .map((r) => r.value)
    .filter((v): v is number => v !== null)
  const maxValue =
    numericValues.length > 0 ? Math.max(...numericValues.map(Math.abs)) : 1

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <h4 className="text-sm font-medium text-slate-500">
          プレビュー（直近7日）
        </h4>
      </div>
      <div className="divide-y divide-gray-100">
        {results.map((r) => (
          <div
            key={r.date}
            className="flex items-center gap-3 px-4 py-2"
          >
            <span className="w-12 shrink-0 text-xs text-slate-400">
              {formatDate(r.date)}
            </span>

            {r.error ? (
              <span className="text-sm text-red-500">{r.error}</span>
            ) : r.value === null ? (
              <span className="text-sm text-slate-300">—</span>
            ) : (
              <div className="flex flex-1 items-center gap-3">
                <span className="w-20 shrink-0 text-right text-sm font-mono text-green-600">
                  {formatValue(r.value)}
                </span>
                {!hasError && maxValue > 0 && (
                  <div className="flex-1">
                    <div
                      className="h-3 rounded-sm bg-indigo-200 transition-all duration-200"
                      style={{
                        width: `${(Math.abs(r.value) / maxValue) * 100}%`,
                        minWidth: '2px',
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
