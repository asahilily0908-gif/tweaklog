'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createExperiment } from '@/app/(app)/app/[project]/experiments/actions'
import { useTranslation } from '@/lib/i18n/config'

interface ExperimentGroup {
  id: string
  name: string
  status: 'testing' | 'steady' | 'completed'
  campaignPatterns: string[]
}

interface Props {
  projectId: string
  platforms: string[]
  groups?: ExperimentGroup[]
  onClose: () => void
}

const CATEGORIES = [
  { value: 'bid', label: 'Bid Adjustment', icon: '💰' },
  { value: 'creative', label: 'Creative', icon: '🎨' },
  { value: 'targeting', label: 'Targeting', icon: '🎯' },
  { value: 'budget', label: 'Budget', icon: '📊' },
  { value: 'structure', label: 'Structure', icon: '🏗️' },
] as const

const PLATFORM_LABELS: Record<string, string> = {
  google_ads: 'Google Ads',
  meta: 'Meta',
  tiktok: 'TikTok',
  yahoo_ads: 'Yahoo! Ads',
  microsoft_ads: 'Microsoft Ads',
  line_ads: 'LINE Ads',
  x_ads: 'X (Twitter) Ads',
}

export default function NewChangeModal({ projectId, platforms, groups, onClose }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState('')
  const [changeDate, setChangeDate] = useState(() => new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState<string>('bid')
  const [platform, setPlatform] = useState(platforms[0] ?? 'google_ads')
  const [campaign, setCampaign] = useState('')
  const [beforeValue, setBeforeValue] = useState('')
  const [afterValue, setAfterValue] = useState('')
  const [reason, setReason] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [clientNote, setClientNote] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function handleClose() {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const result = await createExperiment({
      projectId,
      title,
      createdAt: changeDate,
      category: category as 'bid' | 'creative' | 'targeting' | 'budget' | 'structure',
      platform,
      campaign: campaign || undefined,
      beforeValue: beforeValue || undefined,
      afterValue: afterValue || undefined,
      reason: reason || undefined,
      internalNote: internalNote || undefined,
      clientNote: clientNote || undefined,
      tags,
      groupId: groupId || undefined,
    })

    if (result.error) {
      setError(result.error)
      setSaving(false)
    } else {
      toast.success(t('experiments.modal.successToast'))
      router.refresh()
      onClose()
    }
  }

  const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-sm px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('experiments.logChange')}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{t('experiments.modal.description')}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-150"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Category */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('experiments.category')}</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all duration-150 ${
                    category === cat.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-500/10'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className={`text-[10px] font-medium ${category === cat.value ? 'text-blue-700' : 'text-gray-600'}`}>{t('experiments.categories.' + cat.value)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">{t('experiments.platform')}</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={inputClass}
            >
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p] ?? p}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">{t('experiments.title_field')}</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('experiments.modal.titlePlaceholder')}
              className={inputClass}
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">{t('experiments.date')}</label>
            <input
              type="date"
              required
              value={changeDate}
              onChange={(e) => setChangeDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Group */}
          {groups && groups.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                {t('experiments.modal.groupLabel')} <span className="text-gray-400 font-normal">{t('experiments.modal.optional')}</span>
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t('experiments.modal.noGroup')}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Campaign */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              {t('experiments.campaign')} <span className="text-gray-400 font-normal">{t('experiments.modal.optional')}</span>
            </label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder={t('experiments.modal.campaignPlaceholder')}
              className={inputClass}
            />
          </div>

          {/* Before / After */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">{t('experiments.before')}</label>
              <textarea
                value={beforeValue}
                onChange={(e) => setBeforeValue(e.target.value)}
                rows={2}
                placeholder={t('experiments.modal.beforePlaceholder')}
                className={inputClass + ' resize-none'}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">{t('experiments.after')}</label>
              <textarea
                value={afterValue}
                onChange={(e) => setAfterValue(e.target.value)}
                rows={2}
                placeholder={t('experiments.modal.afterPlaceholder')}
                className={inputClass + ' resize-none'}
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">{t('experiments.reason')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder={t('experiments.modal.reasonPlaceholder')}
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Notes (collapsible) */}
          <details className="group rounded-lg border border-gray-100 bg-gray-50/50">
            <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors select-none">
              {t('experiments.modal.notesAndTags')}
              <span className="ml-1 text-gray-300 group-open:rotate-90 inline-block transition-transform duration-150">&#9654;</span>
            </summary>
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">{t('experiments.modal.internalNote')}</label>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={2}
                  placeholder={t('experiments.modal.internalNotePlaceholder')}
                  className={inputClass + ' resize-none'}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">{t('experiments.modal.clientNote')}</label>
                <textarea
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  rows={2}
                  placeholder={t('experiments.modal.clientNotePlaceholder')}
                  className={inputClass + ' resize-none'}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">{t('experiments.tags')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder={t('experiments.modal.addTagPlaceholder')}
                    className={'flex-1 ' + inputClass}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-all duration-150"
                  >
                    {t('experiments.modal.addTag')}
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </details>

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
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-150"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('experiments.modal.saving')}
                </span>
              ) : (
                t('experiments.modal.logChange')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
