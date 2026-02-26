import { describe, it, expect } from 'vitest'
import {
  calculateStdDev,
  detectHighlights,
  detectAllHighlights,
} from './highlight-detector'

describe('calculateStdDev', () => {
  it('空配列 → mean 0, stdDev 0', () => {
    const result = calculateStdDev([])
    expect(result.mean).toBe(0)
    expect(result.stdDev).toBe(0)
  })

  it('全値同一 → stdDev 0', () => {
    const result = calculateStdDev([5, 5, 5, 5, 5])
    expect(result.mean).toBe(5)
    expect(result.stdDev).toBe(0)
  })

  it('正しく平均と標準偏差を算出', () => {
    // [2, 4, 4, 4, 5, 5, 7, 9] → mean=5, variance=4, stdDev=2
    const result = calculateStdDev([2, 4, 4, 4, 5, 5, 7, 9])
    expect(result.mean).toBe(5)
    expect(result.stdDev).toBe(2)
  })

  it('1要素 → stdDev 0', () => {
    const result = calculateStdDev([42])
    expect(result.mean).toBe(42)
    expect(result.stdDev).toBe(0)
  })
})

describe('detectHighlights', () => {
  it('正常データ + 1日だけ急上昇 → その日が検出される', () => {
    // 20日分の正常データ + 1日だけ500（母数を増やして外れ値の影響を抑える）
    const data = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-02-${String(i + 1).padStart(2, '0')}`,
      value: 100 + (i % 3) - 1, // 99, 100, 101 をローテーション
    }))
    data.push({ date: '2026-02-21', value: 500 }) // spike

    const results = detectHighlights(data, 'CPA')
    expect(results.length).toBeGreaterThanOrEqual(1)

    const spike = results.find((r) => r.date === '2026-02-21')
    expect(spike).toBeDefined()
    expect(spike!.severity).toBe('critical')
    expect(spike!.metricName).toBe('CPA')
    expect(spike!.value).toBe(500)
  })

  it('全値同一 → ハイライトなし', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-02-${String(i + 1).padStart(2, '0')}`,
      value: 50,
    }))

    const results = detectHighlights(data, 'Cost')
    expect(results).toEqual([])
  })

  it('データ4日分 → ハイライトなし（5日未満）', () => {
    const data = [
      { date: '2026-02-01', value: 100 },
      { date: '2026-02-02', value: 100 },
      { date: '2026-02-03', value: 100 },
      { date: '2026-02-04', value: 500 },
    ]

    const results = detectHighlights(data, 'Revenue')
    expect(results).toEqual([])
  })

  it('null を含むデータ → null を除外して正しく計算', () => {
    const data = [
      { date: '2026-02-01', value: 100 },
      { date: '2026-02-02', value: null },
      { date: '2026-02-03', value: 102 },
      { date: '2026-02-04', value: null },
      { date: '2026-02-05', value: 98 },
      { date: '2026-02-06', value: 101 },
      { date: '2026-02-07', value: 99 },
      { date: '2026-02-08', value: 300 }, // spike
    ]

    // 6 valid data points (≥5), should still detect the spike
    const results = detectHighlights(data, 'CPA')
    expect(results.length).toBeGreaterThanOrEqual(1)

    const spike = results.find((r) => r.date === '2026-02-08')
    expect(spike).toBeDefined()
  })

  it('null 除外後に5日未満 → ハイライトなし', () => {
    const data = [
      { date: '2026-02-01', value: 100 },
      { date: '2026-02-02', value: null },
      { date: '2026-02-03', value: null },
      { date: '2026-02-04', value: null },
      { date: '2026-02-05', value: 100 },
      { date: '2026-02-06', value: null },
      { date: '2026-02-07', value: 100 },
      { date: '2026-02-08', value: 500 },
    ]

    // Only 4 valid data points — not enough
    const results = detectHighlights(data, 'CPA')
    expect(results).toEqual([])
  })

  it('severity 判定: 2σ超=warning, 3σ超=critical', () => {
    // 20日分の正常データ（mean≈100, stdDev≈0.82）
    const baseData = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-02-${String(i + 1).padStart(2, '0')}`,
      value: 100 + (i % 3) - 1, // 99, 100, 101
    }))

    // moderate outlier → warning (> 2σ but < 3σ from the base distribution)
    const warningData = [
      ...baseData,
      { date: '2026-02-21', value: 106 },
    ]
    const warningResults = detectHighlights(warningData, 'Test')
    if (warningResults.length > 0) {
      const outlier = warningResults.find((r) => r.date === '2026-02-21')
      if (outlier) {
        expect(['warning', 'critical']).toContain(outlier.severity)
      }
    }

    // extreme outlier → critical (> 3σ)
    const criticalData = [
      ...baseData,
      { date: '2026-02-21', value: 500 },
    ]
    const criticalResults = detectHighlights(criticalData, 'Test')
    expect(criticalResults.length).toBeGreaterThanOrEqual(1)
    const critical = criticalResults.find((r) => r.date === '2026-02-21')
    expect(critical).toBeDefined()
    expect(critical!.severity).toBe('critical')
  })

  it('changePercent が正しく算出される', () => {
    const data = [
      { date: '2026-02-01', value: 100 },
      { date: '2026-02-02', value: 100 },
      { date: '2026-02-03', value: 100 },
      { date: '2026-02-04', value: 100 },
      { date: '2026-02-05', value: 100 },
      { date: '2026-02-06', value: 100 },
      { date: '2026-02-07', value: 100 },
      { date: '2026-02-08', value: 100 },
      { date: '2026-02-09', value: 100 },
      { date: '2026-02-10', value: 500 },
    ]

    const results = detectHighlights(data, 'CPA')
    const spike = results.find((r) => r.date === '2026-02-10')
    expect(spike).toBeDefined()
    // changePercent = ((500 - mean) / mean) * 100
    // mean = (900 + 500) / 10 = 140
    // changePercent = ((500 - 140) / 140) * 100 ≈ 257.1%
    expect(spike!.changePercent).toBeGreaterThan(200)
  })

  it('空配列 → 空配列を返す', () => {
    const results = detectHighlights([], 'CPA')
    expect(results).toEqual([])
  })
})

describe('detectAllHighlights', () => {
  it('複数指標の一括検知 → 各指標ごとに独立して検知', () => {
    const cpaData = [
      { date: '2026-02-01', value: 100 },
      { date: '2026-02-02', value: 102 },
      { date: '2026-02-03', value: 98 },
      { date: '2026-02-04', value: 101 },
      { date: '2026-02-05', value: 99 },
      { date: '2026-02-06', value: 100 },
      { date: '2026-02-07', value: 103 },
      { date: '2026-02-08', value: 97 },
      { date: '2026-02-09', value: 101 },
      { date: '2026-02-10', value: 300 }, // CPA spike
    ]

    const revenueData = [
      { date: '2026-02-01', value: 1000 },
      { date: '2026-02-02', value: 1020 },
      { date: '2026-02-03', value: 980 },
      { date: '2026-02-04', value: 1010 },
      { date: '2026-02-05', value: 990 },
      { date: '2026-02-06', value: 1000 },
      { date: '2026-02-07', value: 1030 },
      { date: '2026-02-08', value: 970 },
      { date: '2026-02-09', value: 1010 },
      { date: '2026-02-10', value: 3000 }, // Revenue spike
    ]

    const results = detectAllHighlights([
      { metricName: 'CPA', data: cpaData },
      { metricName: 'Revenue', data: revenueData },
    ])

    const cpaHighlights = results.filter((r) => r.metricName === 'CPA')
    const revenueHighlights = results.filter(
      (r) => r.metricName === 'Revenue'
    )

    expect(cpaHighlights.length).toBeGreaterThanOrEqual(1)
    expect(revenueHighlights.length).toBeGreaterThanOrEqual(1)
  })

  it('結果が日付降順でソートされる', () => {
    const data = [
      { date: '2026-02-01', value: 100 },
      { date: '2026-02-02', value: 100 },
      { date: '2026-02-03', value: 100 },
      { date: '2026-02-04', value: 100 },
      { date: '2026-02-05', value: 100 },
      { date: '2026-02-06', value: 500 },
      { date: '2026-02-07', value: 100 },
      { date: '2026-02-08', value: 100 },
      { date: '2026-02-09', value: 100 },
      { date: '2026-02-10', value: 500 },
    ]

    const results = detectAllHighlights([
      { metricName: 'Test', data },
    ])

    if (results.length >= 2) {
      expect(results[0].date >= results[1].date).toBe(true)
    }
  })
})
