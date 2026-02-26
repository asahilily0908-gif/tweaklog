'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { guessField } from '@/lib/import/column-mappings'
import type { WizardData } from './SetupWizard'

interface ColumnMappingStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onSkip: () => void
}

const MAPPING_OPTIONS = [
  { value: '', label: '(マッピングしない)' },
  { value: 'date', label: 'Date（日付）' },
  { value: 'campaign', label: 'Campaign（キャンペーン）' },
  { value: 'impressions', label: 'Impressions（表示回数）' },
  { value: 'clicks', label: 'Clicks（クリック数）' },
  { value: 'cost', label: 'Cost（費用）' },
  { value: 'conversions', label: 'Conversions（コンバージョン）' },
  { value: 'revenue', label: 'Revenue（売上）' },
  { value: 'platform', label: 'Platform（プラットフォーム）' },
]

const VALID_MAPPING_VALUES = new Set(
  MAPPING_OPTIONS.filter((o) => o.value).map((o) => o.value)
)

export default function ColumnMappingStep({
  data,
  onChange,
  onSkip,
}: ColumnMappingStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function parseCSV(text: string) {
    const lines = text.trim().split('\n')
    if (lines.length === 0) return

    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().replace(/^"|"$/g, ''))

    const mappings: Record<string, string> = {}
    const usedFields = new Set<string>()
    headers.forEach((header) => {
      const guessed = guessField(header)
      if (guessed && VALID_MAPPING_VALUES.has(guessed) && !usedFields.has(guessed)) {
        mappings[header] = guessed
        usedFields.add(guessed)
      }
    })

    onChange({ csvHeaders: headers, columnMappings: mappings })
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

  function updateMapping(csvHeader: string, field: string) {
    const next = { ...data.columnMappings }
    if (field === '') {
      delete next[csvHeader]
    } else {
      for (const key of Object.keys(next)) {
        if (next[key] === field && key !== csvHeader) {
          delete next[key]
        }
      }
      next[csvHeader] = field
    }
    onChange({ columnMappings: next })
  }

  const hasHeaders = data.csvHeaders.length > 0

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          データを接続しましょう
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          CSVファイルをアップロードして、Tweaklogの標準スキーマにマッピングします。後からでも設定できます。
        </p>
      </div>

      {/* Upload area */}
      <div
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-indigo-400 bg-indigo-50'
            : hasHeaders
              ? 'border-green-300 bg-green-50'
              : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {hasHeaders ? (
          <>
            <div className="mb-2 text-green-600">
              <svg
                className="mx-auto h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-green-700">
              CSVファイルを読み込みました（{data.csvHeaders.length}列）
            </p>
            <p className="mt-1 text-xs text-green-600">
              クリックして別のファイルを選択
            </p>
          </>
        ) : (
          <>
            <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              CSVファイルをドラッグ&ドロップ、またはクリックして選択
            </p>
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
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  CSVの列名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  マッピング先
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {data.csvHeaders.map((header) => (
                <tr key={header}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    <span className="font-medium">{header}</span>
                    {data.columnMappings[header] && (
                      <span className="ml-2 text-green-500">&#10003;</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={data.columnMappings[header] ?? ''}
                      onChange={(e) => updateMapping(header, e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {MAPPING_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          disabled={
                            opt.value !== '' &&
                            Object.values(data.columnMappings).includes(
                              opt.value
                            ) &&
                            data.columnMappings[header] !== opt.value
                          }
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Skip link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
        >
          後で設定する
        </button>
      </div>
    </div>
  )
}
