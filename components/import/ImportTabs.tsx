'use client'

import { useState } from 'react'
import { FileSpreadsheet, Upload, Plus } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/config'
import CsvImportContent from './CsvImportContent'
import SpreadsheetImport from './SpreadsheetImport'

interface Project {
  id: string
  name: string
  platform: string[]
  settings: Record<string, unknown>
}

export interface SpreadsheetConfig {
  id: string
  spreadsheet_url: string
  sheet_gid: string
  header_row: number
  start_column: string
  end_column: string | null
  column_mappings: Record<string, string>
  campaign_name: string | null
  auto_sync: boolean
  sync_schedule: string
  last_synced_at: string | null
}

interface Props {
  project: Project
  spreadsheetConfigs: SpreadsheetConfig[]
}

export default function ImportTabs({ project, spreadsheetConfigs }: Props) {
  const { t } = useTranslation()
  const [showCsv, setShowCsv] = useState(false)
  const [configs, setConfigs] = useState<SpreadsheetConfig[]>(spreadsheetConfigs)
  const [showNewSpreadsheet, setShowNewSpreadsheet] = useState(false)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('import.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('import.uploadDescription')}</p>
      </div>

      {/* Google Spreadsheet section */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t('import.spreadsheetSectionTitle')}
            </h2>
            <p className="text-xs text-gray-500">
              {t('import.spreadsheetSectionDesc')}
            </p>
          </div>
        </div>

        {/* Existing connected spreadsheets */}
        {configs.length > 0 && (
          <div className="space-y-4 mb-4">
            {configs.map((config) => (
              <SpreadsheetImport
                key={config.id}
                project={project}
                existingConfig={config}
                onDeleted={(id) => setConfigs((prev) => prev.filter((c) => c.id !== id))}
                onConfigCreated={(newConfig) => {
                  setConfigs((prev) => prev.map((c) => c.id === config.id ? newConfig : c))
                }}
              />
            ))}
          </div>
        )}

        {/* Add new spreadsheet form */}
        {showNewSpreadsheet ? (
          <SpreadsheetImport
            project={project}
            existingConfig={null}
            onConfigCreated={(newConfig) => {
              setConfigs((prev) => [...prev, newConfig])
              setShowNewSpreadsheet(false)
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNewSpreadsheet(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm font-medium text-slate-500 transition-all hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
          >
            <Plus className="h-4 w-4" />
            {t('import.addSpreadsheet')}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-sm text-slate-400">{t('import.orDivider')}</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* CSV upload */}
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
                {t('import.csvSectionTitle')}
              </p>
              <p className="text-xs text-slate-400">
                {t('import.csvSectionDesc')}
              </p>
            </div>
          </button>
        ) : (
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Upload className="h-5 w-5 text-slate-400" />
              <h2 className="text-sm font-semibold text-gray-900">{t('import.csvSectionTitle')}</h2>
            </div>
            <CsvImportContent project={project} />
          </div>
        )}
      </div>
    </div>
  )
}
