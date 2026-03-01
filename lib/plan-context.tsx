'use client'

import { createContext, useContext } from 'react'

export type PlanType = 'free' | 'pro' | 'team' | 'enterprise'

// Duplicated from stripe/config.ts to avoid importing server-only env vars
const PLAN_FEATURES: Record<string, PlanType[]> = {
  'ai-chat': ['free', 'pro', 'team', 'enterprise'],
  'impact-card': ['free', 'pro', 'team', 'enterprise'],
  'custom-metrics': ['free', 'pro', 'team', 'enterprise'],
  'spreadsheet-sync': ['pro', 'team', 'enterprise'],
  'unlimited-projects': ['pro', 'team', 'enterprise'],
  'team-members': ['team', 'enterprise'],
  'api-export': ['team', 'enterprise'],
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
