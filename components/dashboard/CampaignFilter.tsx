import { useTranslation } from '@/lib/i18n/config'

interface CampaignFilterProps {
  campaigns: (string | null)[]
  selected: string
  onChange: (campaign: string) => void
}

export default function CampaignFilter({ campaigns, selected, onChange }: CampaignFilterProps) {
  const { t } = useTranslation()

  // Build unique sorted list: "all", then "uncategorized" if nulls exist, then named campaigns
  const hasUncategorized = campaigns.some((c) => c === null)
  const named = Array.from(new Set(campaigns.filter((c): c is string => c !== null))).sort()

  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
    >
      <option value="all">{t('dashboard.allCampaigns')}</option>
      {hasUncategorized && (
        <option value="uncategorized">{t('dashboard.uncategorized')}</option>
      )}
      {named.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  )
}
