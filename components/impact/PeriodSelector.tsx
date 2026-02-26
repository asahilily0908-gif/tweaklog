'use client'

import { ArrowRight } from 'lucide-react'

interface PeriodSelectorProps {
  beforeStart: string
  beforeEnd: string
  afterStart: string
  afterEnd: string
  onChange: (periods: {
    beforeStart: string
    beforeEnd: string
    afterStart: string
    afterEnd: string
  }) => void
  changeDate?: string
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export default function PeriodSelector({
  beforeStart,
  beforeEnd,
  afterStart,
  afterEnd,
  onChange,
  changeDate,
}: PeriodSelectorProps) {
  function applyPreset(days: number) {
    if (!changeDate) return
    const date = changeDate.split('T')[0]
    onChange({
      beforeStart: addDays(date, -days),
      beforeEnd: addDays(date, -1),
      afterStart: date,
      afterEnd: addDays(date, days - 1),
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Before period */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Before</span>
          <input
            type="date"
            value={beforeStart}
            onChange={(e) =>
              onChange({ beforeStart: e.target.value, beforeEnd, afterStart, afterEnd })
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-400">〜</span>
          <input
            type="date"
            value={beforeEnd}
            onChange={(e) =>
              onChange({ beforeStart, beforeEnd: e.target.value, afterStart, afterEnd })
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />

        {/* After period */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">After</span>
          <input
            type="date"
            value={afterStart}
            onChange={(e) =>
              onChange({ beforeStart, beforeEnd, afterStart: e.target.value, afterEnd })
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-400">〜</span>
          <input
            type="date"
            value={afterEnd}
            onChange={(e) =>
              onChange({ beforeStart, beforeEnd, afterStart, afterEnd: e.target.value })
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Presets */}
      {changeDate && (
        <div className="flex gap-2">
          {[
            { days: 7, label: '前後7日' },
            { days: 14, label: '前後14日' },
            { days: 30, label: '前後30日' },
          ].map((preset) => (
            <button
              key={preset.days}
              type="button"
              onClick={() => applyPreset(preset.days)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
