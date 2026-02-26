'use client'

import { useState } from 'react'
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
  const [activeTab, setActiveTab] = useState<'csv' | 'spreadsheet'>(
    spreadsheetConfig ? 'spreadsheet' : 'csv'
  )

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('import.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('import.uploadDescription')}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 ${
            activeTab === 'csv'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            {t('import.csvUpload')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('spreadsheet')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 ${
            activeTab === 'spreadsheet'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12h-7.5m8.625 0h7.5m-8.625 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-8.625-3.75c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m8.625-3.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m7.5-3.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" />
            </svg>
            Google Spreadsheet
            {spreadsheetConfig && (
              <span className="rounded-full bg-green-50 border border-green-200 px-1.5 py-0.5 text-[10px] font-semibold text-green-600">
                {t('import.connected')}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'csv' && <CsvImportContent project={project} />}
      {activeTab === 'spreadsheet' && (
        <SpreadsheetImport project={project} existingConfig={spreadsheetConfig} />
      )}
    </div>
  )
}
