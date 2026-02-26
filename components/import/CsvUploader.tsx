'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, CheckCircle } from 'lucide-react'

interface CsvUploaderProps {
  onFileLoaded: (data: {
    headers: string[]
    rows: string[][]
    fileName: string
    rowCount: number
  }) => void
}

/**
 * 簡易CSVパース（ダブルクォート内カンマ対応）
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCsvLine(lines[0])
  const rows = lines.slice(1).map(parseCsvLine)
  return { headers, rows }
}

export default function CsvUploader({ onFileLoaded }: CsvUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [loaded, setLoaded] = useState<{
    fileName: string
    rowCount: number
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const { headers, rows } = parseCsv(text)
        const result = {
          headers,
          rows,
          fileName: file.name,
          rowCount: rows.length,
        }
        setLoaded({ fileName: file.name, rowCount: rows.length })
        onFileLoaded(result)
      }
      reader.readAsText(file)
    },
    [onFileLoaded]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  let borderClass = 'border-slate-300 bg-white'
  let iconColor = 'text-slate-400'

  if (loaded) {
    borderClass = 'border-green-400 bg-green-50'
    iconColor = 'text-green-500'
  } else if (isDragOver) {
    borderClass = 'border-indigo-400 bg-indigo-50 scale-[1.02]'
    iconColor = 'text-indigo-500'
  }

  return (
    <div
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-16 text-center transition-all ${borderClass}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv,.txt"
        className="hidden"
        onChange={handleInputChange}
      />

      {loaded ? (
        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="text-lg font-medium text-green-600">
            {loaded.fileName}（{loaded.rowCount.toLocaleString()}行）を読み込みました
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className={`h-12 w-12 ${iconColor}`} />
          <p className="text-lg font-medium text-slate-700">
            CSVファイルをドラッグ&ドロップ
          </p>
          <p className="text-sm text-slate-400">
            またはクリックしてファイルを選択
          </p>
        </div>
      )}
    </div>
  )
}
