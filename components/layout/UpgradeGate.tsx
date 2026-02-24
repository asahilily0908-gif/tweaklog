'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePlan } from '@/lib/plan-context'
import { useTranslation } from '@/lib/i18n/config'

interface UpgradeGateProps {
  feature: string
  children: React.ReactNode
}

export default function UpgradeGate({ feature, children }: UpgradeGateProps) {
  const { canUseFeature } = usePlan()
  const { t } = useTranslation()
  const pathname = usePathname()

  if (canUseFeature(feature)) {
    return <>{children}</>
  }

  // Extract projectId from pathname: /app/[projectId]/...
  const segments = pathname.split('/')
  const projectIdx = segments.indexOf('app') + 1
  const projectId = segments[projectIdx] || ''

  return (
    <div className="relative">
      {/* Teaser: show children blurred behind overlay */}
      <div className="pointer-events-none select-none blur-[2px] opacity-40">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white/95 px-8 py-8 shadow-lg backdrop-blur-sm max-w-sm text-center">
          {/* Lock icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900">{t('upgrade.title')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('upgrade.description')}</p>
          </div>

          <Link
            href={`/app/${projectId}/settings`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            {t('upgrade.cta')}
          </Link>
        </div>
      </div>
    </div>
  )
}
