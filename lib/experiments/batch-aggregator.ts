// Batch auto-aggregation — pure functions, no external imports

// ─── Types ──────────────────────────────────────────────

export interface ExperimentInput {
  id: string
  userId: string
  createdAt: string // ISO 8601
  batchId?: string
}

export interface BatchGroup {
  batchId: string
  experimentIds: string[]
  userId: string
  startTime: string
  endTime: string
  count: number
}

// ─── Helpers ────────────────────────────────────────────

function diffMinutes(a: string, b: string): number {
  const ta = new Date(a).getTime()
  const tb = new Date(b).getTime()
  return Math.abs(ta - tb) / (1000 * 60)
}

// ─── Main functions ─────────────────────────────────────

/**
 * 同一ユーザーが windowMinutes 以内に記録した連続変更をバッチとしてグルーピング
 *
 * - experiments は createdAt 昇順ソート済みを期待
 * - 1件のみのバッチは返さない（2件以上のみ）
 */
export function aggregateBatches(
  experiments: ExperimentInput[],
  windowMinutes = 30
): BatchGroup[] {
  if (experiments.length === 0) return []

  // Group by userId
  const byUser = new Map<string, ExperimentInput[]>()
  for (const exp of experiments) {
    const list = byUser.get(exp.userId) ?? []
    list.push(exp)
    byUser.set(exp.userId, list)
  }

  const batches: BatchGroup[] = []
  let batchIndex = 0

  for (const [userId, exps] of byUser) {
    // Sort by createdAt ascending
    const sorted = [...exps].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    let currentGroup: ExperimentInput[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]

      if (diffMinutes(prev.createdAt, curr.createdAt) <= windowMinutes) {
        currentGroup.push(curr)
      } else {
        // Flush current group if 2+
        if (currentGroup.length >= 2) {
          batches.push({
            batchId: `batch-${batchIndex++}`,
            experimentIds: currentGroup.map((e) => e.id),
            userId,
            startTime: currentGroup[0].createdAt,
            endTime: currentGroup[currentGroup.length - 1].createdAt,
            count: currentGroup.length,
          })
        }
        currentGroup = [curr]
      }
    }

    // Flush remaining
    if (currentGroup.length >= 2) {
      batches.push({
        batchId: `batch-${batchIndex++}`,
        experimentIds: currentGroup.map((e) => e.id),
        userId,
        startTime: currentGroup[0].createdAt,
        endTime: currentGroup[currentGroup.length - 1].createdAt,
        count: currentGroup.length,
      })
    }
  }

  return batches
}

/**
 * 新しい変更がどのバッチに属するか判定する
 *
 * 直近の同一ユーザーの変更が windowMinutes 以内ならそのバッチに追加、
 * なければ新規バッチIDを生成して返す
 */
export function assignBatch(
  newExperiment: ExperimentInput,
  recentExperiments: ExperimentInput[],
  windowMinutes = 30
): string {
  // Find most recent experiment by the same user
  const sameUser = recentExperiments
    .filter((e) => e.userId === newExperiment.userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

  if (sameUser.length > 0) {
    const latest = sameUser[0]
    if (
      diffMinutes(latest.createdAt, newExperiment.createdAt) <= windowMinutes
    ) {
      // Join existing batch or create one from the latest
      return latest.batchId ?? `batch-${Date.now()}`
    }
  }

  // No recent match — new batch
  return `batch-${Date.now()}`
}
