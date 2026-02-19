'use client'

import { useRef, useState } from 'react'
import { useTranslation } from '@/lib/i18n/config'

interface ColumnMappingStepProps {
  data: {
    csvHeaders: string[]
    csvPreview: string[][]
    columnMappings: Record<string, string>
  }
  onChange: (data: Partial<ColumnMappingStepProps['data']>) => void
}

const STANDARD_FIELDS = [
  { value: '', label: '-- Skip --' },
  { value: 'date', label: 'Date' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'platform', label: 'Platform' },
  { value: 'impressions', label: 'Impressions' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'cost', label: 'Cost' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpc', label: 'CPC' },
  { value: 'cpa', label: 'CPA' },
  { value: 'cvr', label: 'CVR' },
  { value: 'roas', label: 'ROAS' },
]

const AUTO_GUESS_MAP: Record<string, string> = {
  date: 'date',
  day: 'date',
  '日付': 'date',
  campaign: 'campaign',
  'campaign name': 'campaign',
  'キャンペーン': 'campaign',
  platform: 'platform',
  '媒体': 'platform',
  impressions: 'impressions',
  impr: 'impressions',
  'impr.': 'impressions',
  '表示回数': 'impressions',
  clicks: 'clicks',
  'クリック数': 'clicks',
  cost: 'cost',
  spend: 'cost',
  '費用': 'cost',
  conversions: 'conversions',
  conv: 'conversions',
  'conv.': 'conversions',
  'コンバージョン': 'conversions',
  revenue: 'revenue',
  sales: 'revenue',
  '売上': 'revenue',
  'conv. value': 'revenue',
  ctr: 'ctr',
  cpc: 'cpc',
  cpa: 'cpa',
  cvr: 'cvr',
  roas: 'roas',
}

function guessMapping(header: string): string {
  const lower = header.toLowerCase().trim()
  return AUTO_GUESS_MAP[lower] ?? ''
}

export default function ColumnMappingStep({
  data,
  onChange,
}: ColumnMappingStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const { t } = useTranslation()

  function parseCSV(text: string) {
    const lines = text.trim().split('\n')
    if (lines.length === 0) return

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    const preview = lines.slice(1, 4).map((line) =>
      line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    )

    const mappings: Record<string, string> = {}
    const usedFields = new Set<string>()
    headers.forEach((header) => {
      const guessed = guessMapping(header)
      if (guessed && !usedFields.has(guessed)) {
        mappings[header] = guessed
        usedFields.add(guessed)
      }
    })

    onChange({
      csvHeaders: headers,
      csvPreview: preview,
      columnMappings: mappings,
    })
  }

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function updateMapping(csvHeader: string, standardField: string) {
    const next = { ...data.columnMappings }
    if (standardField === '') {
      delete next[csvHeader]
    } else {
      // Remove any existing mapping to this field from other columns
      for (const key of Object.keys(next)) {
        if (next[key] === standardField && key !== csvHeader) {
          delete next[key]
        }
      }
      next[csvHeader] = standardField
    }
    onChange({ columnMappings: next })
  }

  const hasHeaders = data.csvHeaders.length > 0

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-600">
          {t('setup.uploadCsvDescription')}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {t('setup.optionalStep')}
        </p>
      </div>

      {/* Upload area */}
      <div
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : hasHeaders
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {hasHeaders ? (
          <>
            <div className="text-green-600 mb-2">
              <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-green-700">
              {t('setup.csvLoaded').replace('{count}', String(data.csvHeaders.length))}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs text-green-600 underline"
            >
              {t('setup.uploadDifferent')}
            </button>
          </>
        ) : (
          <>
            <svg className="h-10 w-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              {t('setup.dragDropCsv')}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-sm text-blue-600 underline"
            >
              {t('setup.orClickBrowse')}
            </button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Mapping table */}
      {hasHeaders && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('setup.csvColumn')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('setup.mapsTo')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('import.preview')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.csvHeaders.map((header, idx) => (
                <tr key={header}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {header}
                    {data.columnMappings[header] && (
                      <span className="ml-2 text-green-500" title="Auto-detected">
                        &#10003;
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={data.columnMappings[header] ?? ''}
                      onChange={(e) => updateMapping(header, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {STANDARD_FIELDS.map((f) => (
                        <option
                          key={f.value}
                          value={f.value}
                          disabled={f.value !== '' && Object.values(data.columnMappings).includes(f.value) && data.columnMappings[header] !== f.value}
                        >
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                    {data.csvPreview
                      .slice(0, 2)
                      .map((row) => row[idx] ?? '')
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
