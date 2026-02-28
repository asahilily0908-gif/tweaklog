'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { assignBatch } from '@/lib/experiments/batch-aggregator'

interface CreateExperimentInput {
  projectId: string
  title: string
  createdAt: string
  category: 'bid' | 'creative' | 'targeting' | 'budget' | 'structure'
  platform: string
  campaign?: string
  beforeValue?: string
  afterValue?: string
  reason?: string
  internalNote?: string
  clientNote?: string
  tags: string[]
  groupId?: string
}

export async function createExperiment(input: CreateExperimentInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // ── バッチ自動割り当て ──
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data: recentExps } = await supabase
    .from('experiments')
    .select('id, user_id, created_at, batch_id')
    .eq('project_id', input.projectId)
    .eq('user_id', user.id)
    .gte('created_at', thirtyMinAgo)
    .order('created_at', { ascending: false })

  const now = new Date().toISOString()
  const batchId = assignBatch(
    { id: 'new', userId: user.id, createdAt: now },
    (recentExps ?? []).map((e) => ({
      id: e.id,
      userId: e.user_id,
      createdAt: e.created_at,
      batchId: e.batch_id ?? undefined,
    }))
  )

  const { data, error } = await supabase
    .from('experiments')
    .insert({
      project_id: input.projectId,
      user_id: user.id,
      title: input.title || null,
      created_at: input.createdAt ? new Date(input.createdAt + 'T00:00:00').toISOString() : now,
      category: input.category,
      platform: input.platform,
      campaign: input.campaign || null,
      before_value: input.beforeValue || null,
      after_value: input.afterValue || null,
      reason: input.reason || null,
      internal_note: input.internalNote || null,
      client_note: input.clientNote || null,
      tags: input.tags,
      group_id: input.groupId || null,
      batch_id: batchId,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/app/${input.projectId}/experiments`)
  revalidatePath(`/app/${input.projectId}/dashboard`)

  return { id: data.id }
}

export async function deleteExperiment(experimentId: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('experiments')
    .delete()
    .eq('id', experimentId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/app/${projectId}/experiments`)
  revalidatePath(`/app/${projectId}/dashboard`)

  return { success: true }
}
