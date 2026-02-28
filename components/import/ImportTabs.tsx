'use client'

import { useState } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/config'
import CsvImportContent from './CsvImportContent'
import SpreadsheetImport from './SpreadsheetImport'

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
  spreadsheetConfig: SpreadsheetConfig | null
}

export default function ImportTabs({ project, spreadsheetConfig }: Props) {
  const { t } = useTranslation()
  const [showCsv, setShowCsv] = useState(false)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('import.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('import.uploadDescription')}</p>
      </div>

      {/* Main: Google Spreadsheet */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Google スプレッドシートから接続
            </h2>
            <p className="text-xs text-gray-500">
              URLを貼り付けるだけでデータを自動取得・インポート
            </p>
          </div>
        </div>
        <SpreadsheetImport project={project} existingConfig={spreadsheetConfig} />
      </div>

      {/* Divider */}
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-sm text-slate-400">または</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Sub: CSV upload */}
      <div>
        {!showCsv ? (
          <button
            type="button"
            onClick={() => setShowCsv(true)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-4 text-left transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            <Upload className="h-6 w-6 shrink-0 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-700">
                CSVファイルからインポート
              </p>
              <p className="text-xs text-slate-400">
                CSVファイルをドラッグ&ドロップ、またはクリックして選択
              </p>
            </div>
          </button>
        ) : (
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Upload className="h-5 w-5 text-slate-400" />
              <h2 className="text-sm font-semibold text-gray-900">CSVファイルからインポート</h2>
            </div>
            <CsvImportContent project={project} />
          </div>
        )}
      </div>
    </div>
  )
}
