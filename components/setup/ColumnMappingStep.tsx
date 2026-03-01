'use client'

import { useRef, useState } from 'react'
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react'
import { guessField } from '@/lib/import/column-mappings'

interface ColumnMappingData {
  csvHeaders: string[]
  columnMappings: Record<string, string>
  sheetsUrl?: string
}

interface ColumnMappingStepProps {
  data: ColumnMappingData
  onChange: (data: Partial<ColumnMappingData>) => void
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
  const [sheetsUrl, setSheetsUrl] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [sheetsError, setSheetsError] = useState<string | null>(null)

  function parseCSV(text: string) {
    const lines = text.trim().split('\n')
    if (lines.length === 0) return

    const rawHeaders = lines[0]
      .split(',')
      .map((h) => h.trim().replace(/^"|"$/g, ''))

    // Filter to non-empty headers and track their original indices
    const headerEntries: { name: string; index: number }[] = []
    rawHeaders.forEach((h, i) => {
      if (h.trim()) headerEntries.push({ name: h.trim(), index: i })
    })

    const headers = headerEntries.map(e => e.name)

    // Auto-guess mappings
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

  async function handleSheetsConnect() {
    if (!sheetsUrl.includes('docs.google.com/spreadsheets')) return
    setIsConnecting(true)
    setSheetsError(null)

    try {
      const res = await fetch('/api/spreadsheet/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetsUrl.trim() }),
      })

      const result = await res.json()

      if (!res.ok) {
        setSheetsError(result.error || 'スプレッドシートの取得に失敗しました')
        return
      }

      const rows: string[][] = result.rows
      if (rows.length === 0) {
        setSheetsError('スプレッドシートにデータがありません')
        return
      }

      // Auto-detect header row (find row with most guessable fields)
      let bestRow = 0
      let bestScore = 0
      const scanRows = Math.min(rows.length, 10)
      for (let i = 0; i < scanRows; i++) {
        let score = 0
        for (const cell of rows[i]) {
          if (cell && guessField(cell)) score++
        }
        if (score > bestScore) {
          bestScore = score
          bestRow = i
        }
      }

      const rawHeaders = rows[bestRow] as string[]

      // Filter to non-empty headers and track their original indices
      const headerEntries: { name: string; index: number }[] = []
      rawHeaders.forEach((h: string, i: number) => {
        if (h.trim()) headerEntries.push({ name: h.trim(), index: i })
      })

      const headers = headerEntries.map(e => e.name)

      // Auto-guess mappings
      const mappings: Record<string, string> = {}
      const usedFields = new Set<string>()
      headers.forEach((header) => {
        const guessed = guessField(header)
        if (guessed && VALID_MAPPING_VALUES.has(guessed) && !usedFields.has(guessed)) {
          mappings[header] = guessed
          usedFields.add(guessed)
        }
      })

      onChange({ csvHeaders: headers, columnMappings: mappings, sheetsUrl: sheetsUrl.trim() })
    } catch {
      setSheetsError('ネットワークエラーが発生しました。もう一度お試しください。')
    } finally {
      setIsConnecting(false)
    }
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

      {/* Main: Google Sheets */}
      {!hasHeaders && (
        <div className="rounded-2xl border-2 border-slate-200 p-8 transition-all hover:border-green-400 hover:bg-green-50/50">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Google スプレッドシートから接続
              </h3>
              <p className="text-sm text-slate-400">
                URLを貼り付けるだけで自動取得
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={handleSheetsConnect}
              disabled={
                !sheetsUrl.includes('docs.google.com/spreadsheets') ||
                isConnecting
              }
              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConnecting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isConnecting ? '接続中...' : '接続'}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            ※
            シートの共有設定を「リンクを知っている全員が閲覧可」にしてください
          </p>
          {sheetsError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {sheetsError}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      {!hasHeaders && (
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-sm text-slate-400">または</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      )}

      {/* Sub: CSV upload */}
      <div
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
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
                className="mx-auto h-8 w-8"
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
            <Upload className="mx-auto mb-3 h-8 w-8 text-gray-400" />
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
