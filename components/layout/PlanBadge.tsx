'use client'

import { useTranslation } from '@/lib/i18n/config'
import { usePlan } from '@/lib/plan-context'

const BADGE_STYLES: Record<string, string> = {
  free: 'bg-slate-700 text-slate-300',
  pro: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
  team: 'bg-purple-600/20 text-purple-400 border border-purple-500/30',
}

export default function PlanBadge() {
  const { t } = useTranslation()
  const { plan } = usePlan()

  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${BADGE_STYLES[plan] ?? BADGE_STYLES.free}`}>
      {t(`billing.plan.${plan}`)}
    </span>
  )
}
