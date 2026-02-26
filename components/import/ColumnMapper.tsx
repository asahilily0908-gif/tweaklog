'use client'

import { useEffect } from 'react'
import { Check } from 'lucide-react'

interface ColumnMapperProps {
  headers: string[]
  mappings: Record<string, string>
  onChange: (mappings: Record<string, string>) => void
}

const FIELD_OPTIONS = [
  { value: '', label: '(マッピングしない)' },
  { value: 'date', label: 'Date' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'impressions', label: 'Impressions' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'cost', label: 'Cost' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'platform', label: 'Platform' },
]

/**
 * ヘッダー名から自動推定
 */
function guessField(header: string): string {
  const h = header.toLowerCase().trim()

  if (/date|日付|日/.test(h)) return 'date'
  if (/campaign|キャンペーン/.test(h)) return 'campaign'
  if (/impression|表示回数|表示|imp/.test(h)) return 'impressions'
  if (/click|クリック/.test(h)) return 'clicks'
  if (/cost|費用|金額|利用額/.test(h)) return 'cost'
  if (/conversion|コンバージョン|cv(?!r)|成果/.test(h)) return 'conversions'
  if (/revenue|売上|収益/.test(h)) return 'revenue'
  if (/platform|媒体|プラットフォーム/.test(h)) return 'platform'

  return ''
}

export default function ColumnMapper({
  headers,
  mappings,
  onChange,
}: ColumnMapperProps) {
  // Auto-detect on initial render
  useEffect(() => {
    if (Object.keys(mappings).length > 0) return

    const auto: Record<string, string> = {}
    for (const header of headers) {
      const field = guessField(header)
      if (field) auto[header] = field
    }
    if (Object.keys(auto).length > 0) {
      onChange(auto)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers])

  const handleChange = (header: string, value: string) => {
    const next = { ...mappings }
    if (value) {
      next[header] = value
    } else {
      delete next[header]
    }
    onChange(next)
  }

  const mappedCount = Object.values(mappings).filter(Boolean).length

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                CSVの列名
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                マッピング先
              </th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {headers.map((header) => {
              const value = mappings[header] || ''
              const isAutoDetected =
                value !== '' && guessField(header) === value

              return (
                <tr key={header} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <span className="rounded bg-slate-50 px-3 py-1 font-mono text-sm text-slate-700">
                      {header}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={value}
                      onChange={(e) => handleChange(header, e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {FIELD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 text-center">
                    {isAutoDetected && (
                      <Check className="inline h-4 w-4 text-green-500" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {mappedCount}/{headers.length} 列をマッピング済み
      </p>
    </div>
  )
}
