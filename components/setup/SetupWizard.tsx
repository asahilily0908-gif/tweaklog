'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import NorthStarKpiStep from './NorthStarKpiStep'
import MetricConfigStep from './MetricConfigStep'
import SetupCompleteStep from './SetupCompleteStep'
import { completeSetup } from '@/app/(app)/setup/actions'
import { updateProjectSetup } from '@/app/(app)/app/[project]/setup/actions'

export interface WizardData {
  orgName: string
  projectName: string
  northStarKpi: string
  northStarKpiCustomName: string
  subKpis: string[]
  metricConfigs: Array<{
    name: string
    displayName: string
    formula: string
    improvementDirection: 'up' | 'down'
  }>
}

const STEPS = [
  { num: 1, label: 'KPI設定' },
  { num: 2, label: '指標設定' },
  { num: 3, label: '完了' },
]

export default function SetupWizard() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.project as string | undefined
  const isNewSetup = !projectId

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wizardData, setWizardData] = useState<WizardData>({
    orgName: '',
    projectName: '',
    northStarKpi: '',
    northStarKpiCustomName: '',
    subKpis: [],
    metricConfigs: [],
  })

  function updateData(partial: Partial<WizardData>) {
    setWizardData((prev) => ({ ...prev, ...partial }))
  }

  function canProceed(): boolean {
    if (currentStep === 1) {
      if (isNewSetup && (!wizardData.orgName.trim() || !wizardData.projectName.trim())) return false
      if (!wizardData.northStarKpi) return false
      if (wizardData.northStarKpi === 'custom' && !wizardData.northStarKpiCustomName.trim())
        return false
      return true
    }
    return true
  }

  function handleNext() {
    if (currentStep < 3) setCurrentStep((s) => s + 1)
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  async function handleComplete() {
    setIsSubmitting(true)
    try {
      if (isNewSetup) {
        // New user: create org + project
        try {
          const result = await completeSetup({
            orgName: wizardData.orgName || 'My Organization',
            projectName: wizardData.projectName || 'My Project',
            platform: [],
            northStarKpi: wizardData.northStarKpi === 'custom'
              ? wizardData.northStarKpiCustomName.trim()
              : wizardData.northStarKpi,
            subKpis: wizardData.subKpis,
            columnMappings: {},
            metricConfigs: wizardData.metricConfigs,
          })
          if (result?.error) {
            toast.error(result.error)
            setIsSubmitting(false)
            return
          }
          if (result?.projectId) {
            router.push(`/app/${result.projectId}/import`)
            return
          }
        } catch {
          toast.error('セットアップの保存に失敗しました')
          setIsSubmitting(false)
        }
        return
      } else {
        // Existing project: update settings
        const result = await updateProjectSetup(projectId!, wizardData)
        if (result.error) {
          toast.error(result.error)
          setIsSubmitting(false)
          return
        }
        router.push(`/app/${projectId}/dashboard`)
      }
    } catch {
      toast.error('セットアップの保存に失敗しました')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
      {/* Progress bar */}
      <div className="mx-auto max-w-3xl px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 ${
                    step.num < currentStep
                      ? 'bg-green-500 text-white'
                      : step.num === currentStep
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                        : 'bg-gray-300 text-white'
                  }`}
                >
                  {step.num < currentStep ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    step.num < currentStep
                      ? 'text-green-600'
                      : step.num === currentStep
                        ? 'text-indigo-600'
                        : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-3 h-0.5 w-12 sm:w-20 md:w-28 transition-colors ${
                    step.num < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto max-w-3xl px-6 py-8 pb-28">
        {currentStep === 1 && (
          <NorthStarKpiStep data={wizardData} onChange={updateData} isNewSetup={isNewSetup} />
        )}
        {currentStep === 2 && (
          <MetricConfigStep data={wizardData} onChange={updateData} />
        )}
        {currentStep === 3 && (
          <SetupCompleteStep data={wizardData} />
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl flex justify-between px-6 py-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              戻る
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              次へ
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3 text-lg font-semibold text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? '保存中...' : 'ダッシュボードへ'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
