'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/config'

type PlanType = 'free' | 'pro' | 'team'

const BADGE_STYLES: Record<PlanType, string> = {
  free: 'bg-slate-700 text-slate-300',
  pro: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
  team: 'bg-purple-600/20 text-purple-400 border border-purple-500/30',
}

export default function PlanBadge({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const [plan, setPlan] = useState<PlanType>('free')

  useEffect(() => {
    async function fetchPlan() {
      const supabase = createClient()
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', userId)
        .single()

      if (data && ['active', 'trialing'].includes(data.status)) {
        setPlan((data.plan as PlanType) ?? 'free')
      }
    }
    fetchPlan()
  }, [userId])

  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${BADGE_STYLES[plan]}`}>
      {t(`billing.plan.${plan}`)}
    </span>
  )
}
