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
} as const

export type PlanType = keyof typeof PLANS

export const PLAN_FEATURES: Record<string, PlanType[]> = {
  'ai-chat': ['pro', 'team'],
  'impact-card': ['pro', 'team'],
  'custom-metrics': ['pro', 'team'],
  'spreadsheet-sync': ['pro', 'team'],
  'unlimited-projects': ['pro', 'team'],
  'team-members': ['team'],
  'api-export': ['team'],
}
