'use client'

import { useTranslation } from '@/lib/i18n/config'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string
  badge?: string
  accentColor?: 'blue' | 'gray'
  change?: number | null
  improvementDirection?: 'up' | 'down'
}

export default function KpiCard({ label, value, badge, accentColor, change, improvementDirection = 'up' }: KpiCardProps) {
  const { t } = useTranslation()
  const hasBadge = badge && accentColor === 'blue'

  // Determine if the change is positive (good), negative (bad), or neutral
  let changeColor = 'text-gray-400'
  if (change !== undefined && change !== null && change !== 0) {
    const isGood = improvementDirection === 'up' ? change > 0 : change < 0
    changeColor = isGood ? 'text-green-600' : 'text-red-500'
  }

  const badgeBg = accentColor === 'blue'
    ? 'bg-blue-50 text-blue-600'
    : 'bg-gray-100 text-gray-500'

  return (
    <div
      className="relative overflow-hidden rounded-xl border-0 bg-white p-3 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-center gap-1 sm:gap-2">
        <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider truncate">{label}</p>
        {badge && (
          <span className={`hidden sm:inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeBg}`}>
            {badge === 'メインKPI' ? t('dashboard.mainKpi') : badge === 'Custom' ? t('dashboard.custom') : badge}
          </span>
        )}
      </div>
      <div className="mt-1 sm:mt-2 flex items-baseline gap-1 sm:gap-2">
        <p className={`font-bold tabular-nums text-gray-900 truncate ${hasBadge ? 'text-xl sm:text-3xl' : 'text-lg sm:text-2xl'}`}>
          {value}
        </p>
        {change !== undefined && change !== null && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-medium tabular-nums shrink-0 ${changeColor}`}>
            {change !== 0 && (
              change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
            )}
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
