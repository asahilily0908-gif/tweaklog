'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { importOutcomes } from '@/app/(app)/app/[project]/import/actions'
import { saveSpreadsheetConfig, updateLastSynced } from '@/app/(app)/app/[project]/import/actions'
import { STANDARD_FIELDS, guessField, normalizePlatform } from '@/lib/import/column-mappings'
import { useTranslation } from '@/lib/i18n/config'

interface Project {
  id: string
  name: string
  platform: string[]
  settings: Record<string, unknown>
}

interface SpreadsheetConfig {
  id: string
  spreadsheet_url: string
  sheet_gid: string
  header_row: number
  start_column: string
  end_column: string | null
  column_mappings: Record<string, string>
  auto_sync: boolean
  sync_schedule: string
  last_synced_at: string | null
}

interface Props {
  project: Project
  existingConfig?: SpreadsheetConfig | null
}

type Step = 'url' | 'preview' | 'mapping' | 'importing' | 'done'

function columnLetterToIndex(letter: string): number {
  let index = 0
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.toUpperCase().charCodeAt(i) - 64)
  }
  return index - 1
}

function indexToColumnLetter(index: number): string {
  let letter = ''
  let i = index
  while (i >= 0) {
    letter = String.fromCharCode((i % 26) + 65) + letter
    i = Math.floor(i / 26) - 1
  }
  return letter
}

function detectHeaderRow(rows: string[][], maxScan: number = 10): number {
  const scanRows = Math.min(rows.length, maxScan)
  let bestRow = 0
  let bestScore = 0

  for (let i = 0; i < scanRows; i++) {
    let score = 0
    for (const cell of rows[i]) {
      if (cell && guessField(cell)) {
        score++
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestRow = i
    }
  }

  return bestRow
}

export default function SpreadsheetImport({ project, existingConfig }: Props) {
  const router = useRouter()
  const { t } = useTranslation()

  // URL step state
  const [url, setUrl] = useState(existingConfig?.spreadsheet_url ?? '')
  const [step, setStep] = useState<Step>(existingConfig ? 'done' : 'url')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sheet data
  const [allRows, setAllRows] = useState<string[][]>([])
  const [sheetGid, setSheetGid] = useState(existingConfig?.sheet_gid ?? '0')

  // Header & range
  const [headerRow, setHeaderRow] = useState(existingConfig?.header_row ?? 0)
  const [autoDetected, setAutoDetected] = useState(true)
  const [startCol, setStartCol] = useState(existingConfig?.start_column ?? 'A')
  const [endCol, setEndCol] = useState(existingConfig?.end_column ?? '')

  // Mapping
  const [mappings, setMappings] = useState<Record<number, string>>({})
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null)
  const [progress, setProgress] = useState(0)

  // Existing config state
  const [config, setConfig] = useState<SpreadsheetConfig | null>(existingConfig ?? null)

  const headers = useMemo(() => {
    if (allRows.length === 0 || headerRow >= allRows.length) return []
    const startIdx = columnLetterToIndex(startCol)
    const endIdx = endCol ? columnLetterToIndex(endCol) : allRows[headerRow].length - 1
    return allRows[headerRow].slice(startIdx, endIdx + 1)
  }, [allRows, headerRow, startCol, endCol])

  const dataRows = useMemo(() => {
    if (allRows.length === 0 || headerRow >= allRows.length - 1) return []
    const startIdx = columnLetterToIndex(startCol)
    const endIdx = endCol ? columnLetterToIndex(endCol) : allRows[headerRow].length - 1
    return allRows.slice(headerRow + 1).map(row => row.slice(startIdx, endIdx + 1))
  }, [allRows, headerRow, startCol, endCol])

  const handleConnect = useCallback(async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/spreadsheet/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch spreadsheet')
        return
      }

      setAllRows(data.rows)
      setSheetGid(data.gid)

      // Auto-detect header row
      const detectedRow = detectHeaderRow(data.rows)
      setHeaderRow(detectedRow)
      setAutoDetected(true)

      // Auto-detect column range
      const headerCells = data.rows[detectedRow] || []
      let firstNonEmpty = 0
      let lastNonEmpty = headerCells.length - 1
      for (let i = 0; i < headerCells.length; i++) {
        if (headerCells[i]?.trim()) { firstNonEmpty = i; break }
      }
      for (let i = headerCells.length - 1; i >= 0; i--) {
        if (headerCells[i]?.trim()) { lastNonEmpty = i; break }
      }
      setStartCol(indexToColumnLetter(firstNonEmpty))
      setEndCol(indexToColumnLetter(lastNonEmpty))

      // Auto-guess mappings
      const guessed: Record<number, string> = {}
      const usedFields = new Set<string>()
      const slicedHeaders = headerCells.slice(firstNonEmpty, lastNonEmpty + 1)
      slicedHeaders.forEach((h: string, idx: number) => {
        const match = guessField(h)
        if (match && !usedFields.has(match)) {
          guessed[idx] = match
          usedFields.add(match)
        }
      })
      setMappings(guessed)

      setStep('preview')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [url])

  const handleResync = useCallback(async () => {
    if (!config) return
    setUrl(config.spreadsheet_url)
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/spreadsheet/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: config.spreadsheet_url }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to fetch spreadsheet')
        setLoading(false)
        return
      }

      setAllRows(data.rows)
      setSheetGid(data.gid)
      setHeaderRow(config.header_row)
      setAutoDetected(false)
      setStartCol(config.start_column)
      setEndCol(config.end_column ?? '')

      // Restore saved column mappings (with BOM/whitespace-tolerant matching)
      const headerCells = data.rows[config.header_row] || []
      const startIdx = columnLetterToIndex(config.start_column)
      const endIdx = config.end_column ? columnLetterToIndex(config.end_column) : headerCells.length - 1
      const slicedHeaders = headerCells.slice(startIdx, endIdx + 1)
      const restored: Record<number, string> = {}
      // Build a normalized lookup from saved mappings for BOM/whitespace tolerance
      const savedMappingEntries = Object.entries(config.column_mappings)
      slicedHeaders.forEach((h: string, idx: number) => {
        const trimmedH = h.replace(/^\uFEFF/, '').trim()
        // Try exact match first, then trimmed match
        if (config.column_mappings[h]) {
          restored[idx] = config.column_mappings[h]
        } else if (config.column_mappings[trimmedH]) {
          restored[idx] = config.column_mappings[trimmedH]
        } else {
          // Fallback: find a saved key that matches after trimming both sides
          const found = savedMappingEntries.find(([key]) =>
            key.replace(/^\uFEFF/, '').trim() === trimmedH
          )
          if (found) restored[idx] = found[1]
        }
      })
      setMappings(restored)

      // Check if we have any mappings to work with
      if (Object.keys(restored).length === 0) {
        setError('Could not restore column mappings. Please re-configure.')
        toast.error('Could not restore column mappings. Please re-configure.')
        setStep('done')
        setLoading(false)
        return
      }

      // Go straight to importing with saved config
      setStep('importing')
      setProgress(0)

      const outcomeRows = buildOutcomeRowsFromData(
        slicedHeaders,
        data.rows.slice(config.header_row + 1).map((row: string[]) => row.slice(startIdx, endIdx + 1)),
        restored
      )

      if (outcomeRows.length === 0) {
        setError('No valid rows found. Check date format in your spreadsheet.')
        toast.error('No valid rows found. Check date format in your spreadsheet.')
        setStep('done')
        setLoading(false)
        return
      }

      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90))
      }, 200)

      const result = await importOutcomes(project.id, outcomeRows)

      clearInterval(interval)
      setProgress(100)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        setStep('done')
      } else {
        await updateLastSynced(config.id)
        setConfig({ ...config, last_synced_at: new Date().toISOString() })
        setImportResult({ imported: result.imported ?? 0 })
        toast.success(t('import.successImported').replace('{count}', (result.imported ?? 0).toLocaleString()))
        setStep('done')
      }
    } catch {
      setError('Network error. Please try again.')
      setStep('done')
    } finally {
      setLoading(false)
    }
  }, [config, project.id, t])

  function updateMapping(colIndex: number, field: string) {
    setMappings((prev) => {
      const next = { ...prev }
      if (field === '') {
        delete next[colIndex]
      } else {
        for (const key of Object.keys(next)) {
          const k = Number(key)
          if (next[k] === field && k !== colIndex) {
            delete next[k]
          }
        }
        next[colIndex] = field
      }
      return next
    })
  }

  function assignedFields(): Set<string> {
    return new Set(Object.values(mappings))
  }

  function hasDateMapping() {
    return Object.values(mappings).includes('date')
  }

  function normalizeDate(raw: string): string | null {
    const trimmed = raw.trim()
    if (!trimmed) return null

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

    // YYYY/M/D or YYYY/MM/DD
    const slashYmd = trimmed.match(/^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})$/)
    if (slashYmd) {
      return `${slashYmd[1]}-${slashYmd[2].padStart(2, '0')}-${slashYmd[3].padStart(2, '0')}`
    }

    // M/D/YYYY or MM/DD/YYYY (US format)
    const slashMdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (slashMdy) {
      return `${slashMdy[3]}-${slashMdy[1].padStart(2, '0')}-${slashMdy[2].padStart(2, '0')}`
    }

    // Japanese: 2025年1月30日
    const jpDate = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)
    if (jpDate) {
      return `${jpDate[1]}-${jpDate[2].padStart(2, '0')}-${jpDate[3].padStart(2, '0')}`
    }

    // Fallback: try Date.parse
    const parsed = Date.parse(trimmed)
    if (!isNaN(parsed)) {
      const d = new Date(parsed)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    return null
  }

  function parseNum(raw: string | undefined): number {
    if (!raw) return 0
    // Strip currency symbols, commas, spaces
    const cleaned = raw.replace(/[$¥￥,\s]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }

  // Default platform: use the project's first registered platform, fallback to 'google_ads'
  const defaultPlatform = project.platform[0] ?? 'google_ads'

  function buildOutcomeRowsFromData(
    headerList: string[],
    dataRowList: string[][],
    mappingMap: Record<number, string>
  ) {
    const fieldToIdx: Record<string, number> = {}
    for (const [idxStr, field] of Object.entries(mappingMap)) {
      fieldToIdx[field] = Number(idxStr)
    }

    return dataRowList
      .filter((row) => {
        const dateIdx = fieldToIdx['date']
        if (dateIdx === undefined) return false
        const dateVal = row[dateIdx]?.trim()
        return dateVal && normalizeDate(dateVal) !== null
      })
      .map((row) => {
        const customCols: Record<string, number> = {}
        headerList.forEach((h, i) => {
          if (!(i in mappingMap) && row[i]) {
            const num = parseNum(row[i])
            if (num !== 0) {
              customCols[h] = num
            }
          }
        })

        const get = (field: string) => {
          const idx = fieldToIdx[field]
          return idx !== undefined ? row[idx] : undefined
        }

        const rawPlatform = get('platform')
        const platform = rawPlatform ? normalizePlatform(rawPlatform) : defaultPlatform

        return {
          date: normalizeDate(get('date') ?? '') ?? '',
          platform,
          campaign: get('campaign') ?? '',
          impressions: parseNum(get('impressions')),
          clicks: parseNum(get('clicks')),
          cost: parseNum(get('cost')),
          conversions: parseNum(get('conversions')),
          revenue: parseNum(get('revenue')),
          custom_columns: customCols,
        }
      })
  }

  function buildOutcomeRows() {
    return buildOutcomeRowsFromData(headers, dataRows, mappings)
  }

  async function handleImport() {
    setStep('importing')
    setProgress(0)

    const outcomeRows = buildOutcomeRows()

    // Save config
    const columnMappingsObj: Record<string, string> = {}
    for (const [idxStr, field] of Object.entries(mappings)) {
      const header = headers[Number(idxStr)]
      if (header) columnMappingsObj[header] = field
    }

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90))
    }, 200)

    const result = await importOutcomes(project.id, outcomeRows)

    clearInterval(interval)
    setProgress(100)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
      setStep('mapping')
    } else {
      // Save spreadsheet config
      const configResult = await saveSpreadsheetConfig({
        projectId: project.id,
        spreadsheetUrl: url.trim(),
        sheetGid,
        headerRow,
        startColumn: startCol,
        endColumn: endCol || null,
        columnMappings: columnMappingsObj,
      })

      if (configResult.data) {
        setConfig({
          id: configResult.data.id,
          spreadsheet_url: url.trim(),
          sheet_gid: sheetGid,
          header_row: headerRow,
          start_column: startCol,
          end_column: endCol || null,
          column_mappings: columnMappingsObj,
          auto_sync: false,
          sync_schedule: 'daily',
          last_synced_at: new Date().toISOString(),
        })
      }

      setImportResult({ imported: result.imported ?? 0 })
      toast.success(t('import.successImported').replace('{count}', (result.imported ?? 0).toLocaleString()))
      setStep('done')
    }
  }

  const used = assignedFields()
  const mappedCount = Object.keys(mappings).length

  // Detect unknown platform values
  const unknownPlatforms = useMemo(() => {
    const platformColIdx = Object.entries(mappings).find(([, field]) => field === 'platform')?.[0]
    if (platformColIdx === undefined) return []
    const idx = Number(platformColIdx)
    const known = new Set(project.platform)
    const unique = new Set<string>()
    for (const row of dataRows) {
      const val = row[idx]?.trim()
      if (val && !known.has(val)) unique.add(val)
    }
    return Array.from(unique)
  }, [mappings, dataRows, project.platform])

  return (
    <div className="space-y-6">
      {/* Existing config — synced state */}
      {step === 'done' && config && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-900">
                  {t('import.spreadsheetConnected')}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">
                  {config.spreadsheet_url}
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {config.last_synced_at ? (
                  <span>
                    {t('import.lastSynced')}: {new Date(config.last_synced_at).toLocaleString()}
                  </span>
                ) : (
                  <span>{t('import.neverSynced')}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium">
                  {Object.keys(config.column_mappings).length} {t('import.columnsMapped')}
                </span>
              </div>
            </div>

            {importResult && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-xs text-green-700">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('import.successImported').replace('{count}', importResult.imported.toLocaleString())}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleResync}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-40 transition-all duration-150"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                )}
                {t('import.updateNow')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfig(null)
                  setStep('url')
                  setAllRows([])
                  setMappings({})
                  setImportResult(null)
                  setError(null)
                }}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-150"
              >
                {t('import.editConfiguration')}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/app/${project.id}/dashboard`)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-150"
              >
                {t('import.viewDashboard')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: URL Input */}
      {step === 'url' && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900">{t('import.connectSpreadsheet')}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{t('import.spreadsheetDescription')}</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Google Spreadsheet URL
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConnect() }}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={loading || !url.trim()}
                  className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  )}
                  {t('import.connect')}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
              <svg className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-xs text-blue-700">
                {t('import.spreadsheetPublicNote')}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Preview — header row + range detection */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Header row detection */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3.5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{t('import.headerRowDetection')}</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {autoDetected
                    ? t('import.headerRowAutoDetected').replace('{row}', String(headerRow + 1))
                    : t('import.headerRowManual').replace('{row}', String(headerRow + 1))
                  }
                </p>
              </div>
              <select
                value={headerRow}
                onChange={(e) => {
                  setHeaderRow(Number(e.target.value))
                  setAutoDetected(false)
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {Array.from({ length: Math.min(allRows.length, 20) }, (_, i) => (
                  <option key={i} value={i}>
                    {t('import.row')} {i + 1}
                    {i === headerRow && autoDetected ? ` (${t('import.autoDetected')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Data range */}
            <div className="border-b border-gray-100 px-5 py-3 flex items-center gap-4">
              <span className="text-xs font-medium text-gray-600">{t('import.dataRange')}:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={startCol}
                  onChange={(e) => setStartCol(e.target.value.toUpperCase())}
                  className="w-14 rounded-md border border-gray-200 px-2 py-1 text-sm text-center text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  maxLength={2}
                />
                <span className="text-gray-400">:</span>
                <input
                  type="text"
                  value={endCol}
                  onChange={(e) => setEndCol(e.target.value.toUpperCase())}
                  className="w-14 rounded-md border border-gray-200 px-2 py-1 text-sm text-center text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  maxLength={2}
                />
              </div>
              <span className="text-[11px] text-gray-400">
                {startCol}{headerRow + 1}:{endCol}{allRows.length}
              </span>
            </div>

            {/* Spreadsheet preview table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <tbody>
                  {allRows.slice(0, 20).map((row, i) => {
                    const isHeader = i === headerRow
                    const isAboveHeader = i < headerRow
                    return (
                      <tr
                        key={i}
                        onClick={() => { setHeaderRow(i); setAutoDetected(false) }}
                        className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors duration-100 ${
                          isHeader
                            ? 'bg-blue-50 hover:bg-blue-100/70'
                            : isAboveHeader
                            ? 'bg-gray-50/50 hover:bg-gray-100/50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className={`px-3 py-2 text-[10px] font-mono w-10 ${
                          isHeader ? 'text-blue-500 font-semibold' : 'text-gray-300'
                        }`}>
                          {i + 1}
                        </td>
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className={`px-3 py-2 max-w-[160px] truncate ${
                              isHeader
                                ? 'text-blue-700 font-semibold'
                                : isAboveHeader
                                ? 'text-gray-300'
                                : 'text-gray-700'
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {allRows.length > 20 && (
                <p className="border-t border-gray-100 px-5 py-2.5 text-[11px] text-gray-400">
                  ... {t('import.andMoreRows').replace('{count}', (allRows.length - 20).toLocaleString())}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => { setStep('url'); setAllRows([]); setError(null) }}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-150 w-full sm:w-auto"
            >
              {t('import.back')}
            </button>
            <button
              type="button"
              onClick={() => setStep('mapping')}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-all duration-150 w-full sm:w-auto"
            >
              {t('import.nextMapColumns')}
            </button>
          </div>
        </div>
      )}

      {/* Step: Column mapping */}
      {step === 'mapping' && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3.5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{t('import.mapCsvColumns')}</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">{mappedCount} / {headers.length} {t('import.columnsMapped')}</p>
              </div>
              <span className="rounded-full bg-green-50 border border-green-100 px-2.5 py-0.5 text-[10px] font-semibold text-green-700 tabular-nums">
                {mappedCount} {t('import.mapped')}
              </span>
            </div>
            <div className="divide-y divide-gray-100 p-1">
              {headers.map((header, idx) => (
                <div key={idx} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 rounded-lg transition-colors duration-100 ${
                  mappings[idx] ? 'bg-green-50/30' : ''
                }`}>
                  <span className="w-full sm:w-44 text-xs text-gray-700 truncate font-mono bg-gray-100 rounded px-2 py-1">{header}</span>
                  <svg className="hidden sm:block h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <select
                    value={mappings[idx] ?? ''}
                    onChange={(e) => updateMapping(idx, e.target.value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-150 ${
                      mappings[idx] ? 'border-green-300 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <option value="">{t('import.customColumn')}</option>
                    {STANDARD_FIELDS.map((f) => (
                      <option key={f.key} value={f.key} disabled={used.has(f.key) && mappings[idx] !== f.key}>
                        {f.label}{f.required ? ' *' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="w-5 shrink-0">
                    {mappings[idx] ? (
                      <span className="text-green-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    ) : (
                      <span className="text-gray-300 text-[10px] font-medium">{t('import.custom')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unknown platform warning */}
          {unknownPlatforms.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <svg className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">{t('import.unknownPlatforms')}</p>
                <p className="mt-1 text-xs text-amber-700">{t('import.unknownPlatformsDesc')}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {unknownPlatforms.map((p) => (
                    <span key={p} className="rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-900">{t('import.preview')}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{dataRows.length.toLocaleString()} {t('import.rowsDetected')}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    {headers.map((h, idx) => (
                      <th key={idx} className={`px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider ${mappings[idx] ? 'text-gray-600' : 'text-gray-300'}`}>
                        {h}
                        {mappings[idx] && (
                          <span className="ml-1.5 rounded bg-green-50 border border-green-100 px-1 py-0.5 text-[9px] font-semibold text-green-600 normal-case tracking-normal">
                            {mappings[idx]}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                      {row.map((cell, j) => (
                        <td key={j} className={`px-3 py-2 tabular-nums ${mappings[j] ? 'text-gray-700' : 'text-gray-300'}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {dataRows.length > 5 && (
                <p className="border-t border-gray-100 px-5 py-2.5 text-[11px] text-gray-400">
                  ... {t('import.andMoreRows').replace('{count}', (dataRows.length - 5).toLocaleString())}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep('preview')}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-150 w-full sm:w-auto"
            >
              {t('import.back')}
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!hasDateMapping()}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 w-full sm:w-auto"
            >
              {t('import.saveAndImport').replace('{count}', dataRows.length.toLocaleString())}
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 sm:p-16 shadow-sm">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-gray-200 border-t-slate-900" />
          </div>
          <p className="mt-5 text-sm font-semibold text-gray-900">{t('import.importingData')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('import.mayTakeMoment')}</p>
          <div className="mt-6 w-72">
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-700 to-slate-900 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs font-medium text-gray-400 tabular-nums">{progress}%</p>
          </div>
        </div>
      )}
    </div>
  )
}
