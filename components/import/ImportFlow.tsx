'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Upload, ArrowRight, Sparkles } from 'lucide-react'
import CsvUploader from './CsvUploader'
import ColumnMapper from './ColumnMapper'
import ImportProgress from './ImportProgress'
import WowExperience from './WowExperience'

type ImportStep = 'upload' | 'mapping' | 'importing' | 'analyzing' | 'wow'

const STEP_LABELS = [
  { key: 'upload' as const, label: 'アップロード', icon: Upload },
  { key: 'mapping' as const, label: 'マッピング', icon: ArrowRight },
  { key: 'wow' as const, label: '分析', icon: Sparkles },
]

export default function ImportFlow() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.project as string

  const [step, setStep] = useState<ImportStep>('upload')
  const [csvData, setCsvData] = useState<{
    headers: string[]
    rows: string[][]
    fileName: string
    rowCount: number
  } | null>(null)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState(0)

  // Simulated import progress
  useEffect(() => {
    if (step !== 'importing') return

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2.5
        if (next >= 100) {
          clearInterval(interval)
          setTimeout(() => setStep('analyzing'), 200)
          return 100
        }
        return next
      })
    }, 50)

    return () => clearInterval(interval)
  }, [step])

  // Simulated analysis
  useEffect(() => {
    if (step !== 'analyzing') return

    const timeout = setTimeout(() => {
      setStep('wow')
    }, 3000)

    return () => clearTimeout(timeout)
  }, [step])

  const handleFileLoaded = useCallback(
    (data: {
      headers: string[]
      rows: string[][]
      fileName: string
      rowCount: number
    }) => {
      setCsvData(data)
      setStep('mapping')
    },
    []
  )

  const handleStartImport = useCallback(() => {
    setProgress(0)
    setStep('importing')
  }, [])

  const handleViewDashboard = useCallback(() => {
    router.push(`/app/${projectId}/dashboard`)
  }, [router, projectId])

  const handleViewDetail = useCallback(
    (experimentId: string) => {
      router.push(`/app/${projectId}/impact/${experimentId}`)
    },
    [router, projectId]
  )

  const currentStepIndex =
    step === 'upload'
      ? 0
      : step === 'mapping'
        ? 1
        : 2

  const showStepper = step === 'upload' || step === 'mapping'

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Step indicator */}
      {showStepper && (
        <div className="mb-8 flex items-center justify-center gap-4">
          {STEP_LABELS.map((s, i) => {
            const isActive = i === currentStepIndex
            const isDone = i < currentStepIndex
            const Icon = s.icon

            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`h-px w-8 ${
                      isDone ? 'bg-indigo-400' : 'bg-slate-200'
                    }`}
                  />
                )}
                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : isDone
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Step content */}
      {step === 'upload' && <CsvUploader onFileLoaded={handleFileLoaded} />}

      {step === 'mapping' && csvData && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              列のマッピング
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              CSVの各列をTweaklogのフィールドに対応付けてください
            </p>
          </div>

          <ColumnMapper
            headers={csvData.headers}
            mappings={mappings}
            onChange={setMappings}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleStartImport}
              disabled={Object.values(mappings).filter(Boolean).length === 0}
              className="cursor-pointer rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              インポート開始
            </button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <ImportProgress
          status="importing"
          progress={progress}
          importedRows={
            csvData
              ? Math.floor((progress / 100) * csvData.rowCount)
              : undefined
          }
          totalRows={csvData?.rowCount}
        />
      )}

      {step === 'analyzing' && (
        <ImportProgress status="analyzing" progress={0} />
      )}

      {step === 'wow' && (
        <WowExperience
          highlights={[]}
          onViewDashboard={handleViewDashboard}
          onViewDetail={handleViewDetail}
        />
      )}
    </div>
  )
}
