import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_FEATURES, type PlanType } from './config'

function mapOrgPlan(orgPlan: string | null): PlanType {
  if (orgPlan === 'enterprise') return 'enterprise'
  if (orgPlan === 'team') return 'team'
  if (orgPlan === 'personal') return 'pro'
  return 'free'
}

export async function getUserPlan(userId: string): Promise<PlanType> {
  const supabase = createAdminClient()

  console.log('[getUserPlan] userId:', userId)

  // 1. Check personal subscription first
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single()

  console.log('[getUserPlan] subscription data:', JSON.stringify(data))

  if (data && ['active', 'trialing'].includes(data.status) && data.plan !== 'free') {
    console.log('[getUserPlan] returning subscription plan:', data.plan)
    return (data.plan as PlanType) ?? 'free'
  }

  // 2. Fall back: get org_ids from org_members
  const { data: memberships, error: memErr } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)

  console.log('[getUserPlan] memberships:', JSON.stringify(memberships), 'error:', memErr)

  if (memberships && memberships.length > 0) {
    const orgIds = memberships.map(m => m.org_id)

    // 3. Get org plans directly
    const { data: orgs, error: orgErr } = await supabase
      .from('organizations')
      .select('id, plan')
      .in('id', orgIds)

    console.log('[getUserPlan] orgs:', JSON.stringify(orgs), 'error:', orgErr)

    if (orgs && orgs.length > 0) {
      const planRank: Record<PlanType, number> = { free: 0, pro: 1, team: 2, enterprise: 3 }
      let bestPlan: PlanType = 'free'

      for (const org of orgs) {
        const mapped = mapOrgPlan(org.plan)
        console.log('[getUserPlan] org:', org.id, 'plan:', org.plan, 'mapped:', mapped)
        if (planRank[mapped] > planRank[bestPlan]) {
          bestPlan = mapped
        }
      }

      if (bestPlan !== 'free') {
        console.log('[getUserPlan] returning org plan:', bestPlan)
        return bestPlan
      }
    }
  }

  console.log('[getUserPlan] returning free')
  return 'free'
}

export function canUseFeature(plan: PlanType, feature: string): boolean {
  const allowedPlans = PLAN_FEATURES[feature]
  if (!allowedPlans) return true
  return allowedPlans.includes(plan)
}
