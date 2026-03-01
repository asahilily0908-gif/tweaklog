export const PLAN_LIMITS = {
  free: {
    maxOutcomeRows: 1000,
    maxProjects: 1,
    maxExperimentsPerMonth: 10,
    maxCustomMetrics: 0,
    maxAiChatsPerMonth: 0,
    maxTeamMembers: 1,
  },
  pro: {
    maxOutcomeRows: 50000,
    maxProjects: 5,
    maxExperimentsPerMonth: 100,
    maxCustomMetrics: 5,
    maxAiChatsPerMonth: 50,
    maxTeamMembers: 5,
  },
} as const

export type PlanType = keyof typeof PLAN_LIMITS
