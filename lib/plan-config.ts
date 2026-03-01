export const PLAN_LIMITS = {
  free: {
    maxOutcomeRows: 1_000,
    maxProjects: 1,
    maxExperimentsPerMonth: 30,
    maxCustomMetrics: 5,
    maxAiTokensPerMonth: 150_000,
    maxTeamMembers: 1,
  },
  pro: {
    maxOutcomeRows: 50_000,
    maxProjects: 5,
    maxExperimentsPerMonth: Infinity,
    maxCustomMetrics: Infinity,
    maxAiTokensPerMonth: 3_000_000,
    maxTeamMembers: 3,
  },
  team: {
    maxOutcomeRows: 200_000,
    maxProjects: Infinity,
    maxExperimentsPerMonth: Infinity,
    maxCustomMetrics: Infinity,
    maxAiTokensPerMonth: 8_000_000,
    maxTeamMembers: 10,
  },
  enterprise: {
    maxOutcomeRows: Infinity,
    maxProjects: Infinity,
    maxExperimentsPerMonth: Infinity,
    maxCustomMetrics: Infinity,
    maxAiTokensPerMonth: 30_000_000,
    maxTeamMembers: 20,
  },
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export const DATA_PACKS = {
  small:  { rows: 10_000,  price: 500 },
  medium: { rows: 50_000,  price: 1_500 },
  large:  { rows: 200_000, price: 3_000 },
} as const
