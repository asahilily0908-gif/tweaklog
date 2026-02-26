'use client'

import {
  TrendingUp,
  Palette,
  Target,
  DollarSign,
  GitBranch,
} from 'lucide-react'

interface CategoryBadgeProps {
  category: 'bid' | 'creative' | 'targeting' | 'budget' | 'structure'
}

const CATEGORY_CONFIG: Record<
  CategoryBadgeProps['category'],
  {
    bg: string
    text: string
    label: string
    Icon: typeof TrendingUp
  }
> = {
  bid: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: '入札',
    Icon: TrendingUp,
  },
  creative: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    label: 'クリエイティブ',
    Icon: Palette,
  },
  targeting: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'ターゲティング',
    Icon: Target,
  },
  budget: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: '予算',
    Icon: DollarSign,
  },
  structure: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    label: '構造',
    Icon: GitBranch,
  },
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category]
  const { Icon } = config

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
