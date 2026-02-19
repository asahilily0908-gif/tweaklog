'use client'

import { useTranslation } from '@/lib/i18n/config'

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

  const accentGradient = 'bg-gradient-to-r from-blue-500 to-blue-600'

  const badgeBg = accentColor === 'blue'
    ? 'bg-blue-50 text-blue-600'
    : 'bg-gray-100 text-gray-500'

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        hasBadge ? 'border-blue-200' : 'border-gray-200'
      }`}
    >
      {hasBadge && (
        <div className={`absolute inset-x-0 top-0 h-0.5 ${accentGradient}`} />
      )}
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        {badge && (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeBg}`}>
            {badge === 'メインKPI' ? t('dashboard.mainKpi') : badge === 'Custom' ? t('dashboard.custom') : badge}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`font-bold tabular-nums text-gray-900 ${hasBadge ? 'text-3xl' : 'text-2xl'}`}>
          {value}
        </p>
        {change !== undefined && change !== null && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${changeColor}`}>
            {change !== 0 && (
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                {change > 0 ? (
                  <path d="M6 2.5l3.5 4h-7z" />
                ) : (
                  <path d="M6 9.5l3.5-4h-7z" />
                )}
              </svg>
            )}
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
