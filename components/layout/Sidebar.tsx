'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/config'
import PlanBadge from './PlanBadge'
import { usePlan } from '@/lib/plan-context'
import { Logo } from '@/components/ui/Logo'
import { LayoutDashboard, FlaskConical, Upload, MessageSquare, Settings, Globe, LogOut, Menu, X } from 'lucide-react'
import { PLAN_LIMITS, type PlanType } from '@/lib/plan-config'

const NAV_ITEMS = [
  { labelKey: 'nav.dashboard', href: 'dashboard', icon: LayoutDashboard },
  { labelKey: 'nav.experiments', href: 'experiments', icon: FlaskConical },
  { labelKey: 'nav.import', href: 'import', icon: Upload },
  { labelKey: 'nav.aiChat', href: 'chat', icon: MessageSquare },
  { labelKey: 'nav.settings', href: 'settings', icon: Settings },
]

interface SidebarProps {
  projectId: string
  projectName: string
  userEmail: string | null
}

export default function Sidebar({ projectId, projectName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t, locale, setLocale } = useTranslation()
  const { plan } = usePlan()
  const basePath = `/app/${projectId}`
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close on escape key & lock body scroll when open
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEsc)
      return () => {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', handleEsc)
      }
    }
  }, [mobileOpen])

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <Link href={`${basePath}/dashboard`} className="flex items-center gap-2.5">
          <Logo size="sm" />
          <span className="text-sm font-semibold text-slate-800 tracking-tight">Tweaklog</span>
        </Link>
      </div>

      {/* Project name */}
      <div className="mx-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 mb-2">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{t('nav.project')}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-700 truncate">{projectName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const href = `${basePath}/${item.href}`
            const isActive = pathname.startsWith(href)
            const Icon = item.icon
            const aiTokenLimit = item.href === 'chat'
              ? PLAN_LIMITS[plan as PlanType]?.maxAiTokensPerMonth ?? PLAN_LIMITS.free.maxAiTokensPerMonth
              : null
            const aiApproxMessages = aiTokenLimit !== null && aiTokenLimit !== Infinity
              ? `~${Math.floor(aiTokenLimit / 2000)}`
              : null

            return (
              <li key={item.href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {t(item.labelKey)}
                  {aiApproxMessages && (
                    <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {aiApproxMessages}回/月
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Language switcher */}
      <div className="border-t border-slate-200/60 px-3 py-2">
        <button
          type="button"
          onClick={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <Globe className="h-4 w-4" />
          {locale === 'ja' ? 'English' : '日本語'}
        </button>
      </div>

      {/* User section */}
      <div className="border-t border-slate-200/60 px-3 py-3">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-medium text-white">
            {userEmail ? userEmail[0].toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-slate-600">
              {userEmail ?? 'Account'}
            </p>
            <PlanBadge />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm text-slate-700 shadow-sm border border-slate-200/60 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-white/95 backdrop-blur-xl border-r border-slate-200/60 shadow-sm transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 rounded-lg p-1.5 text-slate-400 hover:text-slate-700"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-60 flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-sm shrink-0">
        {sidebarContent}
      </aside>
    </>
  )
}
