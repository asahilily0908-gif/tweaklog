'use client'

interface TemplateSelectorProps {
  onSelect: (template: {
    name: string
    displayName: string
    formula: string
    improvementDirection: 'up' | 'down'
  }) => void
}

const TEMPLATES = [
  {
    name: 'ctr',
    displayName: 'CTR',
    formula: 'Clicks / Impressions * 100',
    improvementDirection: 'up' as const,
    description: 'クリック率（%）',
  },
  {
    name: 'cpc',
    displayName: 'CPC',
    formula: 'Cost / Clicks',
    improvementDirection: 'down' as const,
    description: 'クリック単価',
  },
  {
    name: 'cvr',
    displayName: 'CVR',
    formula: 'Conversions / Clicks * 100',
    improvementDirection: 'up' as const,
    description: 'コンバージョン率（%）',
  },
  {
    name: 'cpa',
    displayName: 'CPA',
    formula: 'Cost / Conversions',
    improvementDirection: 'down' as const,
    description: 'コンバージョン単価',
  },
  {
    name: 'roas',
    displayName: 'ROAS',
    formula: 'Revenue / Cost * 100',
    improvementDirection: 'up' as const,
    description: '広告費用対効果（%）',
  },
]

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.name}
            type="button"
            onClick={() =>
              onSelect({
                name: tmpl.name,
                displayName: tmpl.displayName,
                formula: tmpl.formula,
                improvementDirection: tmpl.improvementDirection,
              })
            }
            className="group px-3 py-1.5 rounded-lg border border-gray-200 text-sm cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200"
          >
            <span className="font-medium text-gray-900 group-hover:text-indigo-700">
              {tmpl.displayName}
            </span>
            <span className="ml-1.5 text-xs text-gray-400 group-hover:text-indigo-500">
              {tmpl.description}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        テンプレートは出発点です。自由に編集できます。
      </p>
    </div>
  )
}
