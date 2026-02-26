'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'

interface AiHighlightMarkerProps {
  date: string
  highlights: Array<{
    metricName: string
    changePercent: number
    severity: 'warning' | 'critical'
  }>
  onClick?: () => void
}

export default function AiHighlightMarker({
  date,
  highlights,
  onClick,
}: AiHighlightMarkerProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const hasCritical = highlights.some((h) => h.severity === 'critical')
  const iconColor = hasCritical ? 'text-red-500' : 'text-amber-500'
  const pulseClass = hasCritical ? 'animate-pulse' : ''

  return (
    <div
      className="relative inline-flex cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.()
      }}
    >
      <Zap className={`h-5 w-5 ${iconColor} ${pulseClass}`} />

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
          <p className="mb-1 font-medium">{date}</p>
          <div className="space-y-0.5">
            {highlights.map((h, i) => {
              const isPositive = h.changePercent >= 0
              return (
                <p key={i}>
                  {h.metricName}{' '}
                  <span
                    className={
                      isPositive ? 'text-red-300' : 'text-blue-300'
                    }
                  >
                    {isPositive ? '▲' : '▼'}
                    {isPositive ? '+' : ''}
                    {h.changePercent.toFixed(1)}%
                  </span>
                </p>
              )
            })}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  )
}
