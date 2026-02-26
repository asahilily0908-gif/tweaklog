import { describe, it, expect } from 'vitest'
import {
  calculateScore,
  calculateChangePercent,
  getScoreColor,
} from './score-calculator'

describe('calculateScore', () => {
  it('改善 (up方向, +15%) → スコア +2', () => {
    expect(calculateScore(15, 'up')).toBe(2)
  })

  it('悪化 (up方向, -20%) → スコア -3 (-20%ちょうどは-3の範囲内)', () => {
    expect(calculateScore(-20, 'up')).toBe(-3)
  })

  it('改善 (down方向, -10%) → スコア +2 (CPA等、下がるほど良い指標)', () => {
    expect(calculateScore(-10, 'down')).toBe(2)
  })

  it('悪化 (down方向, +25%) → スコア -3', () => {
    expect(calculateScore(25, 'down')).toBe(-3)
  })

  it('変化なし (0%) → スコア 0', () => {
    expect(calculateScore(0, 'up')).toBe(0)
  })

  it('微小変化 (+3%) → スコア 0', () => {
    expect(calculateScore(3, 'up')).toBe(0)
  })

  it('極端な改善 (+100%) → スコア +4 (キャップ)', () => {
    expect(calculateScore(100, 'up')).toBe(4)
  })

  it('極端な悪化 (-60%) → スコア -4 (キャップ)', () => {
    expect(calculateScore(-60, 'up')).toBe(-4)
  })

  it('+5% ちょうど → スコア +1', () => {
    expect(calculateScore(5, 'up')).toBe(1)
  })

  it('+10% ちょうど → スコア +2', () => {
    expect(calculateScore(10, 'up')).toBe(2)
  })

  it('+20% ちょうど → スコア +3', () => {
    expect(calculateScore(20, 'up')).toBe(3)
  })

  it('+30% ちょうど → スコア +4', () => {
    expect(calculateScore(30, 'up')).toBe(4)
  })

  it('-5% ちょうど → スコア -1', () => {
    expect(calculateScore(-5, 'up')).toBe(-1)
  })

  it('-10% ちょうど → スコア -2', () => {
    expect(calculateScore(-10, 'up')).toBe(-2)
  })

  it('-20% ちょうど → スコア -3', () => {
    expect(calculateScore(-20, 'up')).toBe(-3)
  })

  it('-30% ちょうど → スコア -4', () => {
    expect(calculateScore(-30, 'up')).toBe(-4)
  })
})

describe('calculateChangePercent', () => {
  it('100 → 150 は +50%', () => {
    expect(calculateChangePercent(100, 150)).toBe(50)
  })

  it('200 → 100 は -50%', () => {
    expect(calculateChangePercent(200, 100)).toBe(-50)
  })

  it('beforeValue が 0 → null', () => {
    expect(calculateChangePercent(0, 100)).toBeNull()
  })

  it('変化なし → 0%', () => {
    expect(calculateChangePercent(50, 50)).toBe(0)
  })
})

describe('getScoreColor', () => {
  it('+3 → bg-green-100 系', () => {
    const color = getScoreColor(3)
    expect(color.bg).toBe('bg-green-100')
    expect(color.label).toBe('大幅改善')
  })

  it('+4 → bg-green-100 系', () => {
    const color = getScoreColor(4)
    expect(color.bg).toBe('bg-green-100')
  })

  it('+2 → bg-green-50 系', () => {
    const color = getScoreColor(2)
    expect(color.bg).toBe('bg-green-50')
    expect(color.label).toBe('改善')
  })

  it('+1 → bg-emerald-50 系', () => {
    const color = getScoreColor(1)
    expect(color.bg).toBe('bg-emerald-50')
    expect(color.label).toBe('やや改善')
  })

  it('0 → bg-slate-50 系', () => {
    const color = getScoreColor(0)
    expect(color.bg).toBe('bg-slate-50')
    expect(color.label).toBe('変化なし')
  })

  it('-1 → bg-orange-50 系', () => {
    const color = getScoreColor(-1)
    expect(color.bg).toBe('bg-orange-50')
    expect(color.label).toBe('やや悪化')
  })

  it('-2 → bg-red-50 系', () => {
    const color = getScoreColor(-2)
    expect(color.bg).toBe('bg-red-50')
    expect(color.label).toBe('悪化')
  })

  it('-3 → bg-red-100 系', () => {
    const color = getScoreColor(-3)
    expect(color.bg).toBe('bg-red-100')
    expect(color.label).toBe('大幅悪化')
  })

  it('-4 → bg-red-100 系', () => {
    const color = getScoreColor(-4)
    expect(color.bg).toBe('bg-red-100')
    expect(color.label).toBe('大幅悪化')
  })
})
