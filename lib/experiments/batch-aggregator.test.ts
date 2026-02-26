import { describe, it, expect } from 'vitest'
import { aggregateBatches, assignBatch } from './batch-aggregator'

describe('aggregateBatches', () => {
  it('同一ユーザー、5分間隔で3件 → 1バッチ（count=3）', () => {
    const experiments = [
      { id: '1', userId: 'u1', createdAt: '2026-02-26T10:00:00Z' },
      { id: '2', userId: 'u1', createdAt: '2026-02-26T10:05:00Z' },
      { id: '3', userId: 'u1', createdAt: '2026-02-26T10:10:00Z' },
    ]

    const batches = aggregateBatches(experiments)
    expect(batches).toHaveLength(1)
    expect(batches[0].count).toBe(3)
    expect(batches[0].experimentIds).toEqual(['1', '2', '3'])
    expect(batches[0].userId).toBe('u1')
  })

  it('同一ユーザー、60分間隔で2件 → バッチなし（各独立）', () => {
    const experiments = [
      { id: '1', userId: 'u1', createdAt: '2026-02-26T10:00:00Z' },
      { id: '2', userId: 'u1', createdAt: '2026-02-26T11:00:00Z' },
    ]

    const batches = aggregateBatches(experiments)
    expect(batches).toHaveLength(0)
  })

  it('異なるユーザー、5分間隔 → バッチなし（ユーザーが違う）', () => {
    const experiments = [
      { id: '1', userId: 'u1', createdAt: '2026-02-26T10:00:00Z' },
      { id: '2', userId: 'u2', createdAt: '2026-02-26T10:05:00Z' },
    ]

    const batches = aggregateBatches(experiments)
    expect(batches).toHaveLength(0)
  })

  it('同一ユーザー、29分間隔 → 1バッチ（ギリギリ閾値内）', () => {
    const experiments = [
      { id: '1', userId: 'u1', createdAt: '2026-02-26T10:00:00Z' },
      { id: '2', userId: 'u1', createdAt: '2026-02-26T10:29:00Z' },
    ]

    const batches = aggregateBatches(experiments)
    expect(batches).toHaveLength(1)
    expect(batches[0].count).toBe(2)
  })

  it('同一ユーザー、31分間隔 → バッチなし（ギリギリ閾値超え）', () => {
    const experiments = [
      { id: '1', userId: 'u1', createdAt: '2026-02-26T10:00:00Z' },
      { id: '2', userId: 'u1', createdAt: '2026-02-26T10:31:00Z' },
    ]

    const batches = aggregateBatches(experiments)
    expect(batches).toHaveLength(0)
  })

  it('1件のみ → バッチなし（2件以上が条件）', () => {
    const experiments = [
      { id: '1', userId: 'u1', createdAt: '2026-02-26T10:00:00Z' },
    ]

    const batches = aggregateBatches(experiments)
    expect(batches).toHaveLength(0)
  })

  it('空配列 → 空配列', () => {
    const batches = aggregateBatches([])
    expect(batches).toEqual([])
  })

  it('カスタム windowMinutes=10 で10分間隔 → 1バッチ', () => {
    const experiments = [
      { id: '1', userId: 'u1', createdAt: '2026-02-26T10:00:00Z' },
      { id: '2', userId: 'u1', createdAt: '2026-02-26T10:10:00Z' },
    ]

    const batches = aggregateBatches(experiments, 10)
    expect(batches).toHaveLength(1)
    expect(batches[0].count).toBe(2)
  })

  it('カスタム windowMinutes=10 で15分間隔 → バッチなし', () => {
    const experiments = [
      { id: '1', userId: 'u1', createdAt: '2026-02-26T10:00:00Z' },
      { id: '2', userId: 'u1', createdAt: '2026-02-26T10:15:00Z' },
    ]

    const batches = aggregateBatches(experiments, 10)
    expect(batches).toHaveLength(0)
  })
})

describe('assignBatch', () => {
  it('直近に同一ユーザーの変更あり（20分前）→ 既存バッチID', () => {
    const newExp = {
      id: 'new',
      userId: 'u1',
      createdAt: '2026-02-26T10:20:00Z',
    }
    const recent = [
      {
        id: '1',
        userId: 'u1',
        createdAt: '2026-02-26T10:00:00Z',
        batchId: 'batch-existing',
      },
    ]

    const batchId = assignBatch(newExp, recent)
    expect(batchId).toBe('batch-existing')
  })

  it('直近に同一ユーザーの変更あり（40分前）→ 新規バッチID', () => {
    const newExp = {
      id: 'new',
      userId: 'u1',
      createdAt: '2026-02-26T10:40:00Z',
    }
    const recent = [
      {
        id: '1',
        userId: 'u1',
        createdAt: '2026-02-26T10:00:00Z',
        batchId: 'batch-existing',
      },
    ]

    const batchId = assignBatch(newExp, recent)
    expect(batchId).not.toBe('batch-existing')
    expect(batchId).toMatch(/^batch-/)
  })

  it('同一ユーザーの変更なし → 新規バッチID', () => {
    const newExp = {
      id: 'new',
      userId: 'u1',
      createdAt: '2026-02-26T10:00:00Z',
    }

    const batchId = assignBatch(newExp, [])
    expect(batchId).toMatch(/^batch-/)
  })

  it('異なるユーザーの変更のみ → 新規バッチID', () => {
    const newExp = {
      id: 'new',
      userId: 'u1',
      createdAt: '2026-02-26T10:05:00Z',
    }
    const recent = [
      {
        id: '1',
        userId: 'u2',
        createdAt: '2026-02-26T10:00:00Z',
        batchId: 'batch-other',
      },
    ]

    const batchId = assignBatch(newExp, recent)
    expect(batchId).not.toBe('batch-other')
  })
})
