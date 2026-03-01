export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
  },
  pro: {
    name: 'Pro',
    price: 3980,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
  },
  team: {
    name: 'Team',
    price: 9800,
    priceId: process.env.STRIPE_TEAM_PRICE_ID ?? null,
  },
  enterprise: {
    name: 'Enterprise',
    price: 49800,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? null,
  },
} as const

export type PlanType = keyof typeof PLANS

export const PLAN_FEATURES: Record<string, PlanType[]> = {
  'ai-chat': ['free', 'pro', 'team', 'enterprise'],
  'impact-card': ['free', 'pro', 'team', 'enterprise'],
  'custom-metrics': ['free', 'pro', 'team', 'enterprise'],
  'spreadsheet-sync': ['pro', 'team', 'enterprise'],
  'unlimited-projects': ['pro', 'team', 'enterprise'],
  'team-members': ['team', 'enterprise'],
  'api-export': ['team', 'enterprise'],
}
