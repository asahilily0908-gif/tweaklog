'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  const { data, error } = await supabase
    .from('experiments')
    .insert({
      project_id: input.projectId,
      user_id: user.id,
      title: input.title || null,
      created_at: input.createdAt ? new Date(input.createdAt + 'T00:00:00').toISOString() : new Date().toISOString(),
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
