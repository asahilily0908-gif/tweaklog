import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_FEATURES, type PlanType } from './config'

export async function getUserPlan(userId: string): Promise<PlanType> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single()

  if (!data || !['active', 'trialing'].includes(data.status)) {
    return 'free'
  }

  return (data.plan as PlanType) ?? 'free'
}

export function canUseFeature(plan: PlanType, feature: string): boolean {
  const allowedPlans = PLAN_FEATURES[feature]
  if (!allowedPlans) return true
  return allowedPlans.includes(plan)
}
