'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { importOutcomes } from '@/app/(app)/app/[project]/import/actions'
import { useTranslation } from '@/lib/i18n/config'
import { STANDARD_FIELDS, guessField } from '@/lib/import/column-mappings'

interface Project {
  id: string
  name: string
  platform: string[]
  settings: Record<string, unknown>
}

interface Props {
  project: Project
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'done'

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) => {
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    cells.push(current.trim())
    return cells
  })

  return { headers, rows }
}

export default function CsvImportContent({ project }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  // Keyed by column INDEX so each dropdown has independent state
  const [mappings, setMappings] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; warning?: string; total?: number; plan?: string; maxRows?: number } | null>(null)
  const [progress, setProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [])

  function processFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError(t('import.pleaseUploadCsv'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCsv(text)

      if (parsed.headers.length === 0) {
        setError(t('import.emptyCsv'))
        return
      }

      setHeaders(parsed.headers)
      setRows(parsed.rows)
      setError(null)

      // Auto-guess mappings by index (case-insensitive, skip duplicates)
      const guessed: Record<number, string> = {}
      const usedFields = new Set<string>()
      parsed.headers.forEach((header, idx) => {
        const match = guessField(header)
        if (match && !usedFields.has(match)) {
          guessed[idx] = match
          usedFields.add(match)
        }
      })
      setMappings(guessed)
      setStep('mapping')
    }
    reader.readAsText(file)
  }

  function updateMapping(colIndex: number, field: string) {
    setMappings((prev) => {
      const next = { ...prev }
      if (field === '') {
        delete next[colIndex]
      } else {
        // Remove any OTHER column that was mapped to this same field
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

  // Collect all currently assigned field values for disabling in dropdowns
  function assignedFields(): Set<string> {
    return new Set(Object.values(mappings))
  }

  function hasDateMapping() {
    return Object.values(mappings).includes('date')
  }

  function buildOutcomeRows() {
    // Build field→column-index map from index-based mappings
    const fieldToIdx: Record<string, number> = {}
    for (const [idxStr, field] of Object.entries(mappings)) {
      fieldToIdx[field] = Number(idxStr)
    }

    return rows
      .filter((row) => {
        const dateIdx = fieldToIdx['date']
        if (dateIdx === undefined) return false
        const dateVal = row[dateIdx]?.trim()
        // Skip rows where date is not a valid date (e.g. header row leaked into data)
        return dateVal && !isNaN(Date.parse(dateVal))
      })
      .map((row) => {
        const customCols: Record<string, number> = {}

        // Unmapped numeric columns go to custom_columns
        headers.forEach((h, i) => {
          if (!(i in mappings) && row[i]) {
            const num = parseFloat(row[i])
            if (!isNaN(num)) {
              customCols[h] = num
            }
          }
        })

        const get = (field: string) => {
          const idx = fieldToIdx[field]
          return idx !== undefined ? row[idx] : undefined
        }

        return {
          date: get('date') ?? '',
          platform: get('platform') ?? 'google_ads',
          campaign: get('campaign') ?? '',
          impressions: parseFloat(get('impressions') ?? '0') || 0,
          clicks: parseFloat(get('clicks') ?? '0') || 0,
          cost: parseFloat(get('cost')?.replace(/[,$¥]/g, '') ?? '0') || 0,
          conversions: parseFloat(get('conversions') ?? '0') || 0,
          revenue: parseFloat(get('revenue')?.replace(/[,$¥]/g, '') ?? '0') || 0,
          custom_columns: customCols,
        }
      })
  }

  async function handleImport() {
    setStep('importing')
    setProgress(0)

    const outcomeRows = buildOutcomeRows()

    // Simulate progress
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
    } else if (result.warning === 'limit_reached') {
      setImportResult({ imported: 0, warning: 'limit_reached', total: result.total, plan: result.plan, maxRows: result.maxRows })
      toast.error('データ上限に達しています')
      setStep('done')
    } else if (result.warning === 'partial_import') {
      setImportResult({ imported: result.imported ?? 0, warning: 'partial_import', total: result.total, plan: result.plan, maxRows: result.maxRows })
      toast.success(t('import.successImported').replace('{count}', (result.imported ?? 0).toLocaleString()))
      setStep('done')
    } else {
      setImportResult({ imported: result.imported ?? 0 })
      toast.success(t('import.successImported').replace('{count}', (result.imported ?? 0).toLocaleString()))
      setStep('done')
    }
  }

  const used = assignedFields()
  const mappedCount = Object.keys(mappings).length

  // Detect unknown platform values from CSV
  const unknownPlatforms = useMemo(() => {
    const platformColIdx = Object.entries(mappings).find(([, field]) => field === 'platform')?.[0]
    if (platformColIdx === undefined) return []
    const idx = Number(platformColIdx)
    const known = new Set(project.platform)
    const unique = new Set<string>()
    for (const row of rows) {
      const val = row[idx]?.trim()
      if (val && !known.has(val)) unique.add(val)
    }
    return Array.from(unique)
  }, [mappings, rows, project.platform])

  return (
    <div>
      {/* Step indicator */}
      {step !== 'upload' && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
          {(['upload', 'mapping', 'importing', 'done'] as const).map((s, i) => {
            const labels = [t('import.upload'), t('import.mapColumns'), t('import.importStep'), t('import.done')]
            const isActive = s === step
            const isPast = ['upload', 'mapping', 'importing', 'done'].indexOf(step) > i
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`h-px w-6 ${isPast ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
                <div className="flex items-center gap-1.5">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    isPast ? 'bg-green-100 text-green-700' :
                    isActive ? 'bg-slate-900 text-white' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isPast ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-gray-900' : isPast ? 'text-green-700' : 'text-gray-400'}`}>
                    {labels[i]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-16 transition-all duration-200 ${
            isDragOver
              ? 'border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-500/5'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
          }`}
        >
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200 ${
            isDragOver ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <svg className={`h-8 w-8 transition-colors duration-200 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="mt-5 text-sm font-semibold text-gray-900">
            {isDragOver ? t('import.dropHere') : t('import.dropCsv')}
          </p>
          <p className="mt-1.5 text-xs text-gray-400">{t('import.csvDescription')}</p>
          <div className="mt-1.5 flex items-center gap-3">
            <span className="h-px w-8 bg-gray-200" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-300">{t('import.or')}</span>
            <span className="h-px w-8 bg-gray-200" />
          </div>
          <label className="mt-3 cursor-pointer rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-all duration-150">
            {t('import.browseFiles')}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && (
        <div className="space-y-6">
          {/* Mapping Table */}
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
                    <option value="">{t('import.skip')}</option>
                    {STANDARD_FIELDS.map((f) => (
                      <option key={f.key} value={f.key} disabled={used.has(f.key) && mappings[idx] !== f.key}>
                        {f.label}{f.required ? ' *' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="w-5 shrink-0">
                    {mappings[idx] && (
                      <span className="text-green-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
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
                <p className="mt-1 text-xs text-amber-700">
                  {t('import.unknownPlatformsDesc')}
                </p>
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
              <h2 className="text-sm font-semibold text-gray-900">
                {t('import.preview')}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{rows.length.toLocaleString()} {t('import.rowsDetected')}</p>
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
                  {rows.slice(0, 5).map((row, i) => (
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
              {rows.length > 5 && (
                <p className="border-t border-gray-100 px-5 py-2.5 text-[11px] text-gray-400">
                  ... {t('import.andMoreRows').replace('{count}', (rows.length - 5).toLocaleString())}
                </p>
              )}
            </div>
          </div>

          {/* Error */}
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
              onClick={() => { setStep('upload'); setHeaders([]); setRows([]); setMappings({}); setError(null); }}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-150 w-full sm:w-auto"
            >
              {t('import.uploadDifferent')}
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!hasDateMapping()}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 w-full sm:w-auto"
            >
              {t('import.importRows').replace('{count}', rows.length.toLocaleString())}
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

      {/* Step: Done */}
      {step === 'done' && importResult && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 sm:p-16 shadow-sm">
          {importResult.warning ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
              <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}

          {importResult.warning === 'limit_reached' ? (
            <>
              <p className="mt-5 text-xl font-bold tracking-tight text-gray-900">データ上限に達しています</p>
              <p className="mt-1.5 text-sm text-gray-500">
                データ行数の上限（{importResult.maxRows?.toLocaleString()}行）に達しています。
              </p>
              <a
                href={`/app/${project.id}/settings`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all duration-150"
              >
                Proプランにアップグレード
              </a>
            </>
          ) : importResult.warning === 'partial_import' ? (
            <>
              <p className="mt-5 text-xl font-bold tracking-tight text-gray-900">一部インポート完了</p>
              <p className="mt-1.5 text-sm text-gray-500">
                {importResult.imported.toLocaleString()}/{importResult.total?.toLocaleString()}行をインポートしました。残り{((importResult.total ?? 0) - importResult.imported).toLocaleString()}行はProプランで取り込めます。
              </p>
              <a
                href={`/app/${project.id}/settings`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all duration-150"
              >
                アップグレードして全件インポート
              </a>
            </>
          ) : (
            <>
              <p className="mt-5 text-xl font-bold tracking-tight text-gray-900">{t('import.importComplete')}</p>
              <p className="mt-1.5 text-sm text-gray-500">
                {t('import.successImported').replace('{count}', importResult.imported.toLocaleString())}
              </p>
            </>
          )}

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => { setStep('upload'); setHeaders([]); setRows([]); setMappings({}); setImportResult(null); }}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-150"
            >
              {t('import.importMore')}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/app/${project.id}/dashboard`)}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-all duration-150"
            >
              {t('import.viewDashboard')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
