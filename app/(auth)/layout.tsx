'use client'

import { useTranslation } from '@/lib/i18n/config'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { locale, setLocale } = useTranslation()

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Language switcher */}
      <button
        type="button"
        onClick={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
        className="absolute top-4 right-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
        </svg>
        {locale === 'ja' ? 'English' : '日本語'}
      </button>

      <div className="w-full max-w-md space-y-8 px-4">{children}</div>
    </div>
  )
}
