'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/config'
import { usePlan } from '@/lib/plan-context'

type PlanType = 'free' | 'pro' | 'team'

interface SubscriptionData {
  plan: PlanType
  status: string
  cancel_at_period_end: boolean
  current_period_end: string | null
  stripe_customer_id: string | null
}

const PLAN_PRICES: Record<PlanType, string> = {
  free: '¥0',
  pro: '¥3,980',
  team: '¥9,800',
}

const PLAN_COLORS: Record<PlanType, { badge: string; border: string }> = {
  free: { badge: 'bg-slate-100 text-slate-700', border: 'border-gray-200' },
  pro: { badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  team: { badge: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
}

export default function BillingSection({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const { plan: currentPlan } = usePlan()
  const [sub, setSub] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSubscription() {
      const supabase = createClient()
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status, cancel_at_period_end, current_period_end, stripe_customer_id')
        .eq('user_id', userId)
        .single()

      if (data) {
        setSub({
          plan: (data.plan as PlanType) ?? 'free',
          status: data.status ?? 'inactive',
          cancel_at_period_end: data.cancel_at_period_end ?? false,
          current_period_end: data.current_period_end,
          stripe_customer_id: data.stripe_customer_id,
        })
      }
      setLoading(false)
    }
    fetchSubscription()
  }, [userId])

  const isActive = sub && ['active', 'trialing'].includes(sub.status)
  const isTrial = sub?.status === 'trialing'

  let trialDaysLeft = 0
  if (isTrial && sub?.current_period_end) {
    const end = new Date(sub.current_period_end)
    const now = new Date()
    trialDaysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  async function handleCheckout(plan: 'pro' | 'team') {
    setActionLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  async function handlePortal() {
    setActionLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  const colors = PLAN_COLORS[currentPlan]

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{t('billing.planManagement')}</h2>
        <p className="mt-0.5 text-xs text-gray-500">{t('billing.planManagementDesc')}</p>
      </div>
      <div className="px-4 sm:px-6 py-5">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 rounded-lg bg-gray-100" />
            <div className="h-10 rounded-lg bg-gray-100 w-1/3" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Current plan display */}
            <div className={`rounded-lg border ${colors.border} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {t('billing.yourPlan')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-bold ${colors.badge}`}>
                      {t(`billing.plan.${currentPlan}`)}
                    </span>
                    {isActive && sub?.status && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isTrial ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {t(`billing.status.${isTrial ? 'trialing' : 'active'}`)}
                      </span>
                    )}
                    {sub?.status === 'past_due' && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700">
                        {t('billing.status.pastDue')}
                      </span>
                    )}
                  </div>
                </div>
                {currentPlan !== 'free' && (
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">{PLAN_PRICES[currentPlan]}</span>
                    <span className="text-sm text-gray-500">{t('billing.perMonth')}</span>
                  </div>
                )}
              </div>
              {isTrial && trialDaysLeft > 0 && (
                <p className="mt-2 text-xs text-amber-600 font-medium">
                  {t('billing.trialRemaining').replace('{days}', String(trialDaysLeft))}
                </p>
              )}
              {sub?.cancel_at_period_end && sub.current_period_end && (
                <p className="mt-2 text-xs text-red-600 font-medium">
                  {new Date(sub.current_period_end).toLocaleDateString()} に解約予定
                </p>
              )}
            </div>

            {/* Upgrade cards */}
            {currentPlan === 'free' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">Pro</span>
                    <span className="text-sm font-bold text-gray-900">
                      {PLAN_PRICES.pro}<span className="text-xs font-normal text-gray-500">{t('billing.perMonth')}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{t('billing.upgradeToProDesc')}</p>
                  <button
                    onClick={() => handleCheckout('pro')}
                    disabled={actionLoading === 'pro'}
                    className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'pro' ? t('billing.redirectingToStripe') : t('billing.tryFree')}
                  </button>
                </div>
                <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">Team</span>
                    <span className="text-sm font-bold text-gray-900">
                      {PLAN_PRICES.team}<span className="text-xs font-normal text-gray-500">{t('billing.perMonth')}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{t('billing.upgradeToTeamDesc')}</p>
                  <button
                    onClick={() => handleCheckout('team')}
                    disabled={actionLoading === 'team'}
                    className="w-full rounded-lg border border-purple-300 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'team' ? t('billing.redirectingToStripe') : t('billing.upgrade')}
                  </button>
                </div>
              </div>
            )}

            {currentPlan === 'pro' && (
              <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">Team</span>
                  <span className="text-sm font-bold text-gray-900">
                    {PLAN_PRICES.team}<span className="text-xs font-normal text-gray-500">{t('billing.perMonth')}</span>
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3">{t('billing.upgradeToTeamDesc')}</p>
                <button
                  onClick={() => handleCheckout('team')}
                  disabled={actionLoading === 'team'}
                  className="w-full rounded-lg border border-purple-300 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'team' ? t('billing.redirectingToStripe') : t('billing.upgrade')}
                </button>
              </div>
            )}

            {/* Manage on Stripe button */}
            {sub?.stripe_customer_id && isActive && (
              <button
                onClick={handlePortal}
                disabled={actionLoading === 'portal'}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'portal' ? t('billing.redirectingToStripe') : t('billing.manageOnStripe')}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
