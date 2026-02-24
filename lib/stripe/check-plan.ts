import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_FEATURES, type PlanType } from './config'

// Map organizations.plan values to PlanType
function mapOrgPlan(orgPlan: string | null): PlanType {
  if (orgPlan === 'team') return 'team'
  if (orgPlan === 'personal') return 'pro'
  return 'free'
}

export async function getUserPlan(userId: string): Promise<PlanType> {
  const supabase = createAdminClient()

  // 1. Check personal subscription first
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single()

  if (data && ['active', 'trialing'].includes(data.status) && data.plan !== 'free') {
    return (data.plan as PlanType) ?? 'free'
  }

  // 2. Fall back to org plan via org_members → organizations
  const { data: orgMemberships } = await supabase
    .from('org_members')
    .select('org_id, organizations(plan)')
    .eq('user_id', userId)

  if (orgMemberships && orgMemberships.length > 0) {
    // Find the highest plan among all orgs the user belongs to
    const planRank: Record<PlanType, number> = { free: 0, pro: 1, team: 2 }
    let bestPlan: PlanType = 'free'

    for (const membership of orgMemberships) {
      const org = membership.organizations as unknown as { plan: string } | null
      if (org) {
        const mapped = mapOrgPlan(org.plan)
        if (planRank[mapped] > planRank[bestPlan]) {
          bestPlan = mapped
        }
      }
    }

    if (bestPlan !== 'free') return bestPlan
  }

  return 'free'
}

export function canUseFeature(plan: PlanType, feature: string): boolean {
  const allowedPlans = PLAN_FEATURES[feature]
  if (!allowedPlans) return true
  return allowedPlans.includes(plan)
}
