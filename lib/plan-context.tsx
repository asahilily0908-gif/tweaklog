'use client'

import { createContext, useContext } from 'react'

export type PlanType = 'free' | 'pro' | 'team'

// Duplicated from stripe/config.ts to avoid importing server-only env vars
const PLAN_FEATURES: Record<string, PlanType[]> = {
  'ai-chat': ['pro', 'team'],
  'impact-card': ['pro', 'team'],
  'custom-metrics': ['pro', 'team'],
  'spreadsheet-sync': ['pro', 'team'],
  'unlimited-projects': ['pro', 'team'],
  'team-members': ['team'],
  'api-export': ['team'],
}

interface PlanContextValue {
  plan: PlanType
  canUseFeature: (feature: string) => boolean
}

const PlanContext = createContext<PlanContextValue>({
  plan: 'free',
  canUseFeature: () => true,
})

export function PlanProvider({ plan, children }: { plan: PlanType; children: React.ReactNode }) {
  return (
    <PlanContext.Provider value={{
      plan,
      canUseFeature: (feature) => {
        const allowed = PLAN_FEATURES[feature]
        if (!allowed) return true
        return allowed.includes(plan)
      },
    }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  return useContext(PlanContext)
}
