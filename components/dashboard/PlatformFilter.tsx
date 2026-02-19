interface PlatformFilterProps {
  platforms: string[]
  labels: Record<string, string>
  selected: string
  onChange: (platform: string) => void
}

const PLATFORM_COLORS: Record<string, string> = {
  google_ads: 'data-[active=true]:bg-blue-600',
  meta: 'data-[active=true]:bg-purple-600',
  tiktok: 'data-[active=true]:bg-red-500',
  yahoo_ads: 'data-[active=true]:bg-red-600',
  microsoft_ads: 'data-[active=true]:bg-teal-600',
  line_ads: 'data-[active=true]:bg-blue-600',
  x_ads: 'data-[active=true]:bg-gray-800',
}

export default function PlatformFilter({ platforms, labels, selected, onChange }: PlatformFilterProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {platforms.map((p) => {
        const isActive = selected === p
        const colorClass = PLATFORM_COLORS[p] ?? 'data-[active=true]:bg-gray-900'

        return (
          <button
            key={p}
            type="button"
            data-active={isActive}
            onClick={() => onChange(p)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${colorClass} ${
              isActive
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {labels[p] ?? p}
          </button>
        )
      })}
    </div>
  )
}
