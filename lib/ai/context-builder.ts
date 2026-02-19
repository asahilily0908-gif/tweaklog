// Pure function — no SDK or DB imports

interface ProjectContext {
  projectName: string
  northStarKpi: string | null
  subKpis: string[]
  platforms: string[]
}

interface ExperimentContext {
  id: string
  category: string
  platform: string
  campaign: string | null
  before_value: string | null
  after_value: string | null
  reason: string | null
  title: string | null
  created_at: string
}

interface OutcomeSummary {
  date: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  revenue: number
}

interface MetricConfigContext {
  name: string
  display_name: string
  formula: string
  improvement_direction: 'up' | 'down'
}

const KPI_LABELS: Record<string, string> = {
  revenue: 'Revenue (higher is better)',
  conversions: 'Conversions (higher is better)',
  cpa: 'CPA — Cost per Acquisition (lower is better)',
  roas: 'ROAS — Return on Ad Spend (higher is better)',
  cvr: 'CVR — Conversion Rate (higher is better)',
  ctr: 'CTR — Click-Through Rate (higher is better)',
  cpc: 'CPC — Cost per Click (lower is better)',
  cost: 'Cost (lower is better)',
  impressions: 'Impressions (higher is better)',
  clicks: 'Clicks (higher is better)',
}

function formatExperiment(exp: ExperimentContext): string {
  const parts = [
    `- [${exp.created_at.split('T')[0]}]`,
    `(${exp.category})`,
    exp.platform,
  ]
  if (exp.title) parts.push(`"${exp.title}"`)
  if (exp.campaign) parts.push(`campaign: ${exp.campaign}`)
  if (exp.before_value && exp.after_value) {
    parts.push(`changed: ${exp.before_value} → ${exp.after_value}`)
  }
  if (exp.reason) parts.push(`reason: ${exp.reason}`)
  return parts.join(' | ')
}

function formatOutcomesTable(outcomes: OutcomeSummary[]): string {
  if (outcomes.length === 0) return 'No outcome data available.'

  const header = 'Date       | Impr     | Clicks | Cost     | Conv  | Revenue'
  const separator = '-----------|----------|--------|----------|-------|--------'
  const rows = outcomes.map((o) => {
    const date = String(o.date)
    const impr = String(Number(o.impressions)).padStart(8)
    const clicks = String(Number(o.clicks)).padStart(6)
    const cost = Number(o.cost).toFixed(0).padStart(8)
    const conv = Number(o.conversions).toFixed(0).padStart(5)
    const rev = Number(o.revenue).toFixed(0).padStart(7)
    return `${date} | ${impr} | ${clicks} | ${cost} | ${conv} | ${rev}`
  })

  return [header, separator, ...rows].join('\n')
}

export function buildSystemPrompt(
  project: ProjectContext,
  recentExperiments: ExperimentContext[],
  outcomeSummary: OutcomeSummary[],
  metricConfigs: MetricConfigContext[]
): string {
  const northStarLabel = project.northStarKpi
    ? KPI_LABELS[project.northStarKpi] ?? project.northStarKpi
    : 'Not set'

  const subKpiList = project.subKpis.length > 0
    ? project.subKpis.map((k) => KPI_LABELS[k] ?? k).join(', ')
    : 'None'

  const experimentsBlock = recentExperiments.length > 0
    ? recentExperiments.map(formatExperiment).join('\n')
    : 'No experiments recorded yet.'

  const outcomesBlock = formatOutcomesTable(outcomeSummary)

  const metricsBlock = metricConfigs.length > 0
    ? metricConfigs.map((m) => `- ${m.display_name} (${m.name}): ${m.formula} [${m.improvement_direction === 'up' ? 'higher is better' : 'lower is better'}]`).join('\n')
    : 'No custom metrics defined.'

  return `You are Tweaklog AI, an expert advertising operations analyst. You help users understand the impact of their ad changes on KPI performance.

## Project: ${project.projectName}
Platforms: ${project.platforms.join(', ') || 'None configured'}
North Star KPI: ${northStarLabel}
Sub-KPIs: ${subKpiList}

## Recent Experiments (ad changes)
${experimentsBlock}

## KPI Data (recent daily aggregates)
${outcomesBlock}

## Custom Metric Definitions
${metricsBlock}

## Guidelines
- Always evaluate changes through the lens of the North Star KPI.
- Never claim causation. Use phrases like "may have contributed to", "correlates with", "the data suggests".
- Format numbers clearly: use commas for thousands, round percentages to 1 decimal.
- Be concise and actionable. Prioritize insights over raw data recitation.
- When comparing periods, specify the exact dates being compared.
- If asked about something not in the data, say so honestly rather than speculating.
- Respond in the same language the user writes in.`
}
