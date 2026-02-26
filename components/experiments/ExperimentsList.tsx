'use client'

import { ClipboardList } from 'lucide-react'
import ExperimentRow from './ExperimentRow'

interface Experiment {
  id: string
  category: 'bid' | 'creative' | 'targeting' | 'budget' | 'structure'
  platform: string
  campaign?: string
  beforeValue?: string
  afterValue?: string
  reason?: string
  tags?: string[]
  batchId?: string
  batchCount?: number
  score?: number
  isAiHighlighted?: boolean
  createdAt: string
  userName?: string
}

interface ExperimentsListProps {
  experiments: Experiment[]
  onExperimentClick?: (id: string) => void
  showScores?: boolean
}

const DEFAULT_EXPERIMENTS: Experiment[] = [
  {
    id: '1',
    category: 'bid',
    platform: 'Google Ads',
    campaign: 'Brand Campaign',
    beforeValue: '¥120',
    afterValue: '¥150',
    reason: 'CVR上昇トレンドに合わせて入札を引き上げ',
    tags: ['optimization'],
    score: 3,
    isAiHighlighted: true,
    createdAt: '2026-02-26T10:30:00Z',
    userName: 'Asahi',
  },
  {
    id: '2',
    category: 'creative',
    platform: 'Meta',
    campaign: 'Retargeting',
    beforeValue: '静止画バナーA',
    afterValue: '動画クリエイティブB',
    reason: '動画素材のCTRが高い傾向',
    tags: ['creative-test'],
    score: -1,
    createdAt: '2026-02-25T14:00:00Z',
    userName: 'Asahi',
  },
  {
    id: '3',
    category: 'targeting',
    platform: 'Google Ads',
    campaign: 'Prospecting',
    beforeValue: '25-54歳',
    afterValue: '25-44歳',
    reason: '45歳以上のCPAが高い',
    score: 2,
    createdAt: '2026-02-24T09:15:00Z',
    userName: 'Asahi',
  },
  {
    id: '4',
    category: 'budget',
    platform: 'TikTok',
    campaign: 'Awareness',
    beforeValue: '¥50,000/日',
    afterValue: '¥80,000/日',
    reason: '月末の予算消化',
    tags: ['budget'],
    score: 0,
    createdAt: '2026-02-23T16:45:00Z',
    userName: 'Asahi',
  },
  {
    id: '5',
    category: 'structure',
    platform: 'Google Ads',
    beforeValue: 'キャンペーン1本',
    afterValue: 'ブランド/非ブランド分割',
    reason: '検索語句レポートで非ブランドのCPAが高い',
    score: 4,
    isAiHighlighted: true,
    createdAt: '2026-02-22T11:00:00Z',
    userName: 'Asahi',
  },
  {
    id: 'batch-1',
    category: 'bid',
    platform: 'Google Ads',
    campaign: '複数キャンペーン',
    beforeValue: '各種',
    afterValue: '一括+10%',
    reason: '全体的にCPA改善余地あり',
    batchId: 'batch-001',
    batchCount: 3,
    score: 1,
    createdAt: '2026-02-21T13:30:00Z',
    userName: 'Asahi',
  },
]

export default function ExperimentsList({
  experiments,
  onExperimentClick,
  showScores = true,
}: ExperimentsListProps) {
  const items = experiments.length > 0 ? experiments : DEFAULT_EXPERIMENTS

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ClipboardList className="h-12 w-12 text-slate-300" />
        <p className="mt-4 text-base font-medium text-slate-500">
          まだ変更が記録されていません
        </p>
        <p className="mt-1 text-sm text-slate-400">
          右下の + ボタンまたは Ctrl+K から変更を記録しましょう
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">変更履歴</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {items.length}
          </span>
        </div>

        {/* Filter placeholders */}
        <div className="flex gap-2">
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-slate-600"
            defaultValue="all"
          >
            <option value="all">全て</option>
            <option value="bid">入札</option>
            <option value="creative">クリエイティブ</option>
            <option value="targeting">ターゲティング</option>
            <option value="budget">予算</option>
            <option value="structure">構造</option>
          </select>
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-slate-600"
            defaultValue="newest"
          >
            <option value="newest">新しい順</option>
            <option value="score-high">スコア高い順</option>
            <option value="score-low">スコア低い順</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {items.map((experiment) => (
          <ExperimentRow
            key={experiment.id}
            experiment={experiment}
            onClick={onExperimentClick}
            showScores={showScores}
          />
        ))}
      </div>
    </div>
  )
}
