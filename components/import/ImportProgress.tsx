'use client'

import { Loader2, Sparkles, CheckCircle } from 'lucide-react'

interface ImportProgressProps {
  status: 'importing' | 'analyzing' | 'complete'
  progress: number // 0-100
  importedRows?: number
  totalRows?: number
}

export default function ImportProgress({
  status,
  progress,
  importedRows,
  totalRows,
}: ImportProgressProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6">
      {status === 'importing' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-lg font-medium text-slate-900">
            データをインポート中...
          </p>
          <div className="h-2 w-64 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {importedRows !== undefined && totalRows !== undefined && (
            <p className="text-sm text-slate-400">
              {importedRows.toLocaleString()} / {totalRows.toLocaleString()} 行
            </p>
          )}
        </>
      )}

      {status === 'analyzing' && (
        <>
          <Sparkles className="h-12 w-12 animate-pulse text-amber-500" />
          <p className="text-lg font-medium text-slate-900">
            AIが変更履歴を分析中...
          </p>
          <p className="text-sm text-slate-400">
            過去の変更からインパクトの大きかったものを検出しています
          </p>
          <div className="h-2 w-64 overflow-hidden rounded-full bg-slate-200">
            <div className="shimmer-bar h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
          </div>
          <style jsx>{`
            .shimmer-bar {
              width: 40%;
              animation: shimmer 1.5s ease-in-out infinite;
            }
            @keyframes shimmer {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(250%);
              }
            }
          `}</style>
        </>
      )}

      {status === 'complete' && (
        <>
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="text-lg font-medium text-slate-900">分析完了！</p>
        </>
      )}
    </div>
  )
}
