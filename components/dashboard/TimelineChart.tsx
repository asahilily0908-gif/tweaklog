'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import ScoreBadge from '@/components/impact/ScoreBadge'
import { useTranslation } from '@/lib/i18n/config'

interface DailyData {
  date: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  revenue: number
  [key: string]: unknown
}

interface Experiment {
  id: string
  created_at: string
  category: string
  is_ai_highlighted: boolean
  title: string | null
  before_value: string | null
  after_value: string | null
  user_email: string | null
}

interface CustomMetricLine {
  label: string
  format: 'percent' | 'currency' | 'ratio' | 'number'
}

interface TimelineChartProps {
  data: DailyData[]
  northStarKey?: string
  isAllMode: boolean
  experiments: Experiment[]
  onExperimentClick?: (experiments: Experiment[], date: string) => void
  customMetricLine?: CustomMetricLine
  impactScores?: Map<string, number | null>
}

const KPI_TO_FIELD: Record<string, keyof DailyData> = {
  revenue: 'revenue',
  conversions: 'conversions',
  impressions: 'impressions',
  clicks: 'clicks',
  cost: 'cost',
}

// Category colors for marker dots
const CATEGORY_DOT_COLORS: Record<string, string> = {
  bid: '#3b82f6',             // blue
  creative: '#a855f7',        // purple
  targeting: '#f97316',       // orange
  budget: '#22c55e',          // green
  structure: '#6b7280',       // gray
  query: '#06b6d4',           // cyan
  creative_version: '#d946ef',// fuchsia
  bid_strategy: '#f43f5e',    // rose
  audience: '#14b8a6',        // teal
  placement: '#eab308',       // yellow
  tracking: '#6366f1',        // indigo
  pmax_asset: '#84cc16',      // lime
  automation: '#0ea5e9',      // sky
}

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  bid: 'bg-blue-100 text-blue-700',
  creative: 'bg-purple-100 text-purple-700',
  targeting: 'bg-orange-100 text-orange-700',
  budget: 'bg-green-100 text-green-700',
  structure: 'bg-gray-100 text-gray-700',
  query: 'bg-cyan-100 text-cyan-700',
  creative_version: 'bg-fuchsia-100 text-fuchsia-700',
  bid_strategy: 'bg-rose-100 text-rose-700',
  audience: 'bg-teal-100 text-teal-700',
  placement: 'bg-yellow-100 text-yellow-700',
  tracking: 'bg-indigo-100 text-indigo-700',
  pmax_asset: 'bg-lime-100 text-lime-700',
  automation: 'bg-sky-100 text-sky-700',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatAxisValue(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toFixed(0)
}

function formatAxisByType(value: number, format: string) {
  switch (format) {
    case 'percent': return `${value.toFixed(1)}%`
    case 'currency': return `$${formatAxisValue(value)}`
    case 'ratio': return `${value.toFixed(1)}x`
    default: return formatAxisValue(value)
  }
}

function formatTooltipByType(value: number, format: string) {
  switch (format) {
    case 'percent': return `${value.toFixed(2)}%`
    case 'currency': return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    case 'ratio': return `${value.toFixed(2)}x`
    default: return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }
}

function formatTooltipValue(value: number, name: string) {
  if (name === 'cost' || name === 'revenue') {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
  dataKey: string
}

function DefaultTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length || !label) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-lg">
      <p className="text-[11px] font-medium text-gray-500 mb-1.5">{formatFullDate(label)}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[11px] text-gray-600 capitalize">{entry.name}</span>
          <span className="ml-auto text-[11px] font-semibold tabular-nums text-gray-900">
            {formatTooltipValue(entry.value, entry.name)}
          </span>
        </div>
      ))}
    </div>
  )
}

function CustomMetricTooltip({ format, metricLabel }: { format: string; metricLabel: string }) {
  return function Tooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
    if (!active || !payload?.length || !label) return null

    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-lg">
        <p className="text-[11px] font-medium text-gray-500 mb-1.5">{formatFullDate(label)}</p>
        {payload.map((entry) => {
          const isCustom = entry.dataKey === '_custom'
          const displayName = isCustom ? metricLabel : entry.name
          const displayValue = isCustom
            ? formatTooltipByType(entry.value, format)
            : formatTooltipValue(entry.value, entry.name)

          return (
            <div key={entry.name} className="flex items-center gap-2 py-0.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[11px] text-gray-600">{displayName}</span>
              <span className="ml-auto text-[11px] font-semibold tabular-nums text-gray-900">
                {displayValue}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
}

interface HoveredExperiments {
  exps: Experiment[]
  date: string
  clientX: number
  clientY: number
}

const CHART_MARGIN = { top: 24, right: 20, bottom: 5, left: 0 }
const Y_AXIS_WIDTH = 40

export default function TimelineChart({ data, northStarKey, isAllMode, experiments, onExperimentClick, customMetricLine, impactScores }: TimelineChartProps) {
  const { t } = useTranslation()
  const [hoveredExps, setHoveredExps] = useState<HoveredExperiments | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const primaryField = northStarKey ? (KPI_TO_FIELD[northStarKey] ?? 'conversions') : 'conversions'
  const showCustom = !!customMetricLine

  // Observe container width for marker position calculation
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Map dates to experiments
  const experimentsByDate = useMemo(() => {
    const map = new Map<string, Experiment[]>()
    for (const e of experiments) {
      const date = e.created_at.split('T')[0]
      const existing = map.get(date) ?? []
      existing.push(e)
      map.set(date, existing)
    }
    return map
  }, [experiments])

  const experimentDates = useMemo(() => new Set(experimentsByDate.keys()), [experimentsByDate])

  // Calculate marker x-positions from container width and data index
  const markerPositions = useMemo(() => {
    if (containerWidth === 0 || data.length === 0) return new Map<string, number>()

    const hasRightAxis = !showCustom && isAllMode
    const plotLeft = CHART_MARGIN.left + Y_AXIS_WIDTH
    const plotRight = CHART_MARGIN.right + (hasRightAxis ? Y_AXIS_WIDTH : 0)
    const plotWidth = containerWidth - plotLeft - plotRight
    const n = data.length

    const positions = new Map<string, number>()
    data.forEach((d, i) => {
      if (experimentsByDate.has(d.date)) {
        const x = plotLeft + (i + 0.5) * (plotWidth / n)
        positions.set(d.date, x)
      }
    })
    return positions
  }, [containerWidth, data, experimentsByDate, showCustom, isAllMode])

  const CustomTooltipComponent = useMemo(() => {
    if (!customMetricLine) return null
    return CustomMetricTooltip({ format: customMetricLine.format, metricLabel: customMetricLine.label })
  }, [customMetricLine])

  return (
    <div className="h-72 relative" ref={containerRef}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 24, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            dy={8}
          />

          {showCustom ? (
            <YAxis
              yAxisId="left"
              tickFormatter={(v: number) => formatAxisByType(v, customMetricLine.format)}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              dx={-4}
            />
          ) : (
            <>
              <YAxis
                yAxisId="left"
                tickFormatter={formatAxisValue}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                dx={-4}
              />
              {isAllMode && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v: number) => `$${formatAxisValue(v)}`}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
              )}
            </>
          )}

          <Tooltip
            content={showCustom && CustomTooltipComponent ? <CustomTooltipComponent /> : <DefaultTooltip />}
            cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
          />

          {/* Experiment reference lines with colored dots (visual only) */}
          {data
            .filter((d) => experimentDates.has(d.date))
            .map((d) => {
              const exps = experimentsByDate.get(d.date)!
              const primaryCategory = exps[0].category
              const dotColor = CATEGORY_DOT_COLORS[primaryCategory] || '#6b7280'

              return (
                <ReferenceLine
                  key={`${d.date}-visible`}
                  x={d.date}
                  yAxisId="left"
                  stroke={dotColor}
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={(props: any) => {
                    const { viewBox } = props
                    if (!viewBox) return null
                    return (
                      <g>
                        <circle
                          cx={viewBox.x}
                          cy={viewBox.y - 8}
                          r={5}
                          fill={dotColor}
                          stroke="white"
                          strokeWidth={2}
                        />
                        {exps.length > 1 && (
                          <>
                            <circle
                              cx={viewBox.x + 10}
                              cy={viewBox.y - 12}
                              r={7}
                              fill={dotColor}
                            />
                            <text
                              x={viewBox.x + 10}
                              y={viewBox.y - 11.5}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="white"
                              fontSize={8}
                              fontWeight="bold"
                            >
                              {exps.length}
                            </text>
                          </>
                        )}
                      </g>
                    )
                  }}
                />
              )
            })}

          {showCustom ? (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="_custom"
              name={customMetricLine.label}
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              connectNulls
            />
          ) : isAllMode ? (
            <>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey={primaryField}
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cost"
                stroke="#94a3b8"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }}
                strokeDasharray="6 4"
              />
            </>
          ) : (
            <>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="conversions"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="clicks"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* HTML overlay for reliable click/hover on experiment markers */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from(experimentsByDate.entries()).map(([date, exps]) => {
          const x = markerPositions.get(date)
          if (x === undefined) return null

          return (
            <div
              key={date}
              className="absolute pointer-events-auto"
              style={{
                left: x - 14,
                top: 0,
                width: 28,
                height: 48,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                setHoveredExps({
                  exps,
                  date,
                  clientX: e.clientX,
                  clientY: e.clientY,
                })
              }}
              onMouseLeave={() => setHoveredExps(null)}
              onClick={() => {
                if (onExperimentClick) {
                  onExperimentClick(exps, date)
                }
              }}
            />
          )
        })}
      </div>

      {/* Experiment hover tooltip */}
      {hoveredExps && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: hoveredExps.clientX,
            top: hoveredExps.clientY + 16,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-[300px] min-w-[200px]">
            <p className="text-[11px] font-medium text-gray-500 mb-2">
              {hoveredExps.date}
            </p>
            <div className="space-y-2">
              {hoveredExps.exps.map((exp, idx) => (
                <div
                  key={exp.id}
                  className={hoveredExps.exps.length > 1 && idx < hoveredExps.exps.length - 1 ? 'border-b border-gray-100 pb-2' : ''}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        CATEGORY_BADGE_STYLES[exp.category] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {t(`experiments.categories.${exp.category}`) || exp.category}
                    </span>
                    {impactScores?.has(exp.id) && (
                      <ScoreBadge score={impactScores.get(exp.id) ?? null} />
                    )}
                  </div>
                  {exp.title && (
                    <p className="text-xs font-medium text-gray-900 mt-1 line-clamp-2">{exp.title}</p>
                  )}
                  {exp.before_value && exp.after_value && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      <span className="text-red-400 line-through">{exp.before_value}</span>
                      <span className="mx-1">&rarr;</span>
                      <span className="text-green-600">{exp.after_value}</span>
                    </p>
                  )}
                  {exp.user_email && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{exp.user_email}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
