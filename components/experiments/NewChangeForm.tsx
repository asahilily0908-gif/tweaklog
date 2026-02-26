'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, X } from 'lucide-react'
import CategoryBadge from './CategoryBadge'

type Category = 'bid' | 'creative' | 'targeting' | 'budget' | 'structure'

interface NewChangeData {
  category: Category
  platform: string
  campaign: string
  beforeValue: string
  afterValue: string
  reason: string
  internalNote: string
  clientNote: string
  tags: string[]
}

interface NewChangeFormProps {
  onClose: () => void
  onSubmit?: (data: NewChangeData) => void
  prefillText?: string
  projectId: string
}

const CATEGORIES: Category[] = [
  'bid',
  'creative',
  'targeting',
  'budget',
  'structure',
]

const PLATFORMS = [
  'Google Ads',
  'Meta',
  'TikTok',
  'Yahoo! Ads',
  'LINE Ads',
  'X Ads',
  'Microsoft Ads',
  'Other',
]

function parsePrefill(text: string): Partial<NewChangeData> {
  const result: Partial<NewChangeData> = { reason: text }

  if (/入札/i.test(text)) result.category = 'bid'
  else if (/クリエイティブ|creative/i.test(text)) result.category = 'creative'
  else if (/ターゲティング|targeting/i.test(text))
    result.category = 'targeting'
  else if (/予算|budget/i.test(text)) result.category = 'budget'
  else if (/構造|structure/i.test(text)) result.category = 'structure'

  // Try to extract yen values
  const yenMatches = text.match(/(\d[\d,]*)\s*円/g)
  if (yenMatches && yenMatches.length >= 2) {
    result.beforeValue = yenMatches[0]
    result.afterValue = yenMatches[1]
  } else if (yenMatches && yenMatches.length === 1) {
    result.afterValue = yenMatches[0]
  }

  return result
}

export default function NewChangeForm({
  onClose,
  onSubmit,
  prefillText,
  projectId,
}: NewChangeFormProps) {
  const [category, setCategory] = useState<Category | null>(null)
  const [platform, setPlatform] = useState('')
  const [campaign, setCampaign] = useState('')
  const [beforeValue, setBeforeValue] = useState('')
  const [afterValue, setAfterValue] = useState('')
  const [reason, setReason] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [clientNote, setClientNote] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Apply prefill
  useEffect(() => {
    if (!prefillText) return
    const parsed = parsePrefill(prefillText)
    if (parsed.category) setCategory(parsed.category)
    if (parsed.beforeValue) setBeforeValue(parsed.beforeValue)
    if (parsed.afterValue) setAfterValue(parsed.afterValue)
    if (parsed.reason) setReason(parsed.reason)
  }, [prefillText])

  const isValid = category && platform && beforeValue && afterValue

  const handleSubmit = () => {
    if (!isValid) return
    const data: NewChangeData = {
      category: category!,
      platform,
      campaign,
      beforeValue,
      afterValue,
      reason,
      internalNote,
      clientNote,
      tags,
    }
    console.log('New change:', data, 'projectId:', projectId)
    onSubmit?.(data)
    onClose()
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput('')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">変更を記録</h3>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Category */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          カテゴリ <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`cursor-pointer rounded-lg p-1 transition-all ${
                category === cat
                  ? 'ring-2 ring-indigo-500 ring-offset-2'
                  : 'hover:ring-1 hover:ring-slate-300'
              }`}
            >
              <CategoryBadge category={cat} />
            </button>
          ))}
        </div>
      </div>

      {/* Platform */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          プラットフォーム <span className="text-red-500">*</span>
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">選択してください</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Campaign */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          キャンペーン名
        </label>
        <input
          type="text"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          placeholder="キャンペーン名"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Before / After */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          変更内容 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
          <input
            type="text"
            value={beforeValue}
            onChange={(e) => setBeforeValue(e.target.value)}
            placeholder="変更前"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={afterValue}
            onChange={(e) => setAfterValue(e.target.value)}
            placeholder="変更後"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          変更理由
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="なぜこの変更を行いましたか？"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          タグ
        </label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
            >
              {tag}
              <button
                type="button"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                className="cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            placeholder="タグを入力してEnter"
            className="min-w-[140px] flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Advanced options toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="cursor-pointer text-sm text-slate-500 hover:text-slate-700"
      >
        {showAdvanced ? '▼ 詳細オプションを閉じる' : '▶ 詳細オプション'}
      </button>

      {showAdvanced && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Internal Note
            </label>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="チーム内メモ（クライアントには非表示）"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Client Note
            </label>
            <textarea
              value={clientNote}
              onChange={(e) => setClientNote(e.target.value)}
              placeholder="クライアント向けメモ"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          記録する
        </button>
      </div>
    </div>
  )
}
