'use client'

import { useTranslation } from '@/lib/i18n/config'
import { usePlan } from '@/lib/plan-context'

const BADGE_STYLES: Record<string, string> = {
  free: 'bg-slate-100 text-slate-500',
  pro: 'bg-blue-50 text-blue-600 border border-blue-200/50',
  team: 'bg-purple-50 text-purple-600 border border-purple-200/50',
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
