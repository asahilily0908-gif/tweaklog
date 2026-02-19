import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: 'Experiment Detail | Tweaklog',
}

const CATEGORY_LABELS: Record<string, string> = {
  bid: 'Bid Adjustment',
  creative: 'Creative',
  targeting: 'Targeting',
  budget: 'Budget',
  structure: 'Structure',
}

const CATEGORY_COLORS: Record<string, string> = {
  bid: 'bg-amber-50 text-amber-700',
  creative: 'bg-purple-50 text-purple-700',
  targeting: 'bg-blue-50 text-blue-700',
  budget: 'bg-blue-50 text-blue-700',
  structure: 'bg-gray-100 text-gray-700',
}

export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ project: string; id: string }>
}) {
  const { project: projectId, id: experimentId } = await params
  const supabase = await createClient()

  const { data: experiment } = await supabase
    .from('experiments')
    .select('*')
    .eq('id', experimentId)
    .single()

  if (!experiment) {
    notFound()
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
        <Link href={`/app/${projectId}/experiments`} className="hover:text-gray-600 transition-colors">
          Experiments
        </Link>
        <span>/</span>
        <span className="text-gray-700">Detail</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          {experiment.is_ai_highlighted && <span className="text-xl">⚡</span>}
          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${CATEGORY_COLORS[experiment.category] ?? 'bg-gray-100 text-gray-700'}`}>
            {CATEGORY_LABELS[experiment.category] ?? experiment.category}
          </span>
          <span className="text-sm text-gray-500">
            {experiment.platform === 'google_ads' ? 'Google Ads' : experiment.platform === 'meta' ? 'Meta' : experiment.platform}
          </span>
          {experiment.campaign && (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">{experiment.campaign}</span>
            </>
          )}
        </div>

        {/* Diff */}
        {experiment.before_value && experiment.after_value && (
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <p className="mb-1 text-xs font-medium text-gray-500">Change</p>
            <div className="flex items-center gap-3 text-lg">
              <span className="rounded bg-red-50 px-2 py-0.5 text-red-600 line-through">{experiment.before_value}</span>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              <span className="rounded bg-green-50 px-2 py-0.5 font-medium text-green-600">{experiment.after_value}</span>
            </div>
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {experiment.reason && (
            <div>
              <p className="text-xs font-medium text-gray-500">Reason</p>
              <p className="mt-1 text-sm text-gray-700">{experiment.reason}</p>
            </div>
          )}
          {experiment.internal_note && (
            <div>
              <p className="text-xs font-medium text-gray-500">Internal Note</p>
              <p className="mt-1 text-sm text-gray-700">{experiment.internal_note}</p>
            </div>
          )}
          {experiment.client_note && (
            <div>
              <p className="text-xs font-medium text-gray-500">Client Note</p>
              <p className="mt-1 text-sm text-gray-700">{experiment.client_note}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500">Date</p>
            <p className="mt-1 text-sm text-gray-700">
              {new Date(experiment.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Tags */}
        {experiment.tags.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500">Tags</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {experiment.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
