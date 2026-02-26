'use client'

import { Sparkles } from 'lucide-react'
import ScoreBadge from '@/components/impact/ScoreBadge'
import CategoryBadge from '@/components/experiments/CategoryBadge'
import DiffDisplay from '@/components/experiments/DiffDisplay'

interface WowHighlight {
  rank: number
  experimentId: string
  category: 'bid' | 'creative' | 'targeting' | 'budget' | 'structure'
  platform: string
  campaign?: string
  beforeValue?: string
  afterValue?: string
  reason?: string
  score: number
  northStarChangePercent: number
  date: string
}

interface WowExperienceProps {
  highlights: WowHighlight[]
  onViewDashboard: () => void
  onViewDetail: (experimentId: string) => void
}

const MOCK_HIGHLIGHTS: WowHighlight[] = [
  {
    rank: 1,
    experimentId: 'wow-1',
    category: 'structure',
    platform: 'Google Ads',
    campaign: 'Brand / Non-Brand Split',
    beforeValue: 'キャンペーン1本',
    afterValue: 'ブランド/非ブランド分割',
    reason: '検索語句のパフォーマンス差が大きかった',
    score: 4,
    northStarChangePercent: 35.2,
    date: '2025-08-15',
  },
  {
    rank: 2,
    experimentId: 'wow-2',
    category: 'creative',
    platform: 'Meta',
    campaign: 'Retargeting',
    beforeValue: '静止画バナー',
    afterValue: 'UGC風動画',
    reason: 'CTR改善のためフォーマット変更',
    score: 3,
    northStarChangePercent: 28.9,
    date: '2025-10-03',
  },
  {
    rank: 3,
    experimentId: 'wow-3',
    category: 'bid',
    platform: 'Google Ads',
    campaign: 'Generic Keywords',
    beforeValue: '手動CPC ¥150',
    afterValue: 'tCPA ¥3,000',
    reason: '自動入札への移行テスト',
    score: 3,
    northStarChangePercent: 22.1,
    date: '2025-11-20',
  },
  {
    rank: 4,
    experimentId: 'wow-4',
    category: 'targeting',
    platform: 'Meta',
    campaign: 'Prospecting LAL',
    beforeValue: 'LAL 1%',
    afterValue: 'LAL 3% + 興味関心除外',
    reason: 'リーチ拡大しつつ質を維持',
    score: 2,
    northStarChangePercent: 15.7,
    date: '2026-01-08',
  },
  {
    rank: 5,
    experimentId: 'wow-5',
    category: 'budget',
    platform: 'TikTok',
    campaign: 'App Install',
    beforeValue: '¥30,000/日',
    afterValue: '¥80,000/日',
    reason: '好調な週末に予算拡大',
    score: -2,
    northStarChangePercent: -18.4,
    date: '2026-02-01',
  },
]

function getRankStyle(rank: number): string {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
    case 2:
      return 'bg-gradient-to-br from-slate-300 to-slate-500 text-white'
    case 3:
      return 'bg-gradient-to-br from-orange-300 to-orange-500 text-white'
    default:
      return 'bg-slate-200 text-slate-600'
  }
}

export default function WowExperience({
  highlights,
  onViewDashboard,
  onViewDetail,
}: WowExperienceProps) {
  const items = highlights.length > 0 ? highlights : MOCK_HIGHLIGHTS

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <Sparkles className="mx-auto h-8 w-8 text-amber-500" />
        <h2 className="mt-3 text-2xl font-bold text-slate-900">
          過去の変更から、最もインパクトが大きかった5つ
        </h2>
        <p className="mt-2 text-slate-500">
          AIがあなたの変更履歴を分析しました
        </p>
      </div>

      {/* Ranking cards */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.experimentId}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 opacity-0 transition-all hover:shadow-md"
            style={{
              animation: `fadeInUp 0.5s ease-out ${index * 150}ms forwards`,
            }}
            onClick={() => onViewDetail(item.experimentId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ')
                onViewDetail(item.experimentId)
            }}
          >
            <div className="flex items-start gap-4">
              {/* Rank badge */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${getRankStyle(item.rank)}`}
              >
                {item.rank}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                {/* Row 1: Category + Platform + Date */}
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={item.category} />
                  <span className="text-xs text-slate-400">
                    {item.platform}
                  </span>
                  <span className="text-xs text-slate-400">{item.date}</span>
                </div>

                {/* Row 2: Campaign */}
                {item.campaign && (
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {item.campaign}
                  </p>
                )}

                {/* Row 3: Diff */}
                {(item.beforeValue || item.afterValue) && (
                  <div className="mt-1">
                    <DiffDisplay
                      before={item.beforeValue}
                      after={item.afterValue}
                    />
                  </div>
                )}

                {/* Row 4: Reason */}
                {item.reason && (
                  <p className="mt-1 text-sm italic text-slate-500">
                    {item.reason}
                  </p>
                )}
              </div>

              {/* Score badge */}
              <div className="shrink-0">
                <ScoreBadge
                  score={item.score}
                  changePercent={item.northStarChangePercent}
                  size="lg"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div
        className="flex justify-center opacity-0"
        style={{
          animation: `fadeInUp 0.5s ease-out ${items.length * 150 + 200}ms forwards`,
        }}
      >
        <button
          type="button"
          onClick={onViewDashboard}
          className="cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3 text-lg font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg"
        >
          ダッシュボードで見る
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
