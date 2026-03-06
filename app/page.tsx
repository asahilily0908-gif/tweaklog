'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import {
  ClipboardList,
  BarChart3,
  MessageSquareText,
  LayoutDashboard,
  Upload,
  Sheet,
  ArrowRight,
  ChevronDown,
  Database,
  PenLine,
  Sparkles,
  Check,
  Menu,
  X,
  Pencil,
  Cpu,
} from 'lucide-react'

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, isVisible } = useScrollAnimation()
  return (
    <div
      ref={ref}
      id={id}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  )
}

function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()
  return (
    <button
      onClick={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
    >
      {locale === 'ja' ? 'EN' : 'JA'}
    </button>
  )
}

interface MockPoint { date: string; cpa: number; marker?: number }

const MOCK_DATA_30D: MockPoint[] = [
  { date: '2/1', cpa: 2800 }, { date: '2/2', cpa: 2750 }, { date: '2/3', cpa: 2820 },
  { date: '2/4', cpa: 2700 }, { date: '2/5', cpa: 2650, marker: 1 },
  { date: '2/6', cpa: 2580 }, { date: '2/7', cpa: 2520 }, { date: '2/8', cpa: 2560 },
  { date: '2/9', cpa: 2500 }, { date: '2/10', cpa: 2480 },
  { date: '2/11', cpa: 2520 }, { date: '2/12', cpa: 2450, marker: 2 },
  { date: '2/13', cpa: 2380 }, { date: '2/14', cpa: 2400 }, { date: '2/15', cpa: 2350 },
  { date: '2/16', cpa: 2380 }, { date: '2/17', cpa: 2320 }, { date: '2/18', cpa: 2360 },
  { date: '2/19', cpa: 2300, marker: 3 }, { date: '2/20', cpa: 2280 },
  { date: '2/21', cpa: 2250 }, { date: '2/22', cpa: 2300 }, { date: '2/23', cpa: 2260 },
  { date: '2/24', cpa: 2240 }, { date: '2/25', cpa: 2280 }, { date: '2/26', cpa: 2220 },
  { date: '2/27', cpa: 2260 }, { date: '2/28', cpa: 2340 },
]

const MOCK_DATA_7D: MockPoint[] = [
  { date: '2/22', cpa: 2300 }, { date: '2/23', cpa: 2260 },
  { date: '2/24', cpa: 2240 }, { date: '2/25', cpa: 2280 },
  { date: '2/26', cpa: 2220 }, { date: '2/27', cpa: 2260 }, { date: '2/28', cpa: 2340 },
]

const MARKERS = [
  { id: 1, color: '#8b5cf6', labelKey: 'marker1', tooltipKey: 'tooltip1', dotClass: 'bg-purple-500' },
  { id: 2, color: '#f97316', labelKey: 'marker2', tooltipKey: 'tooltip2', dotClass: 'bg-orange-500' },
  { id: 3, color: '#22c55e', labelKey: 'marker3', tooltipKey: 'tooltip3', dotClass: 'bg-green-500' },
]

function DashboardMockup({ t }: { t: (key: string) => string }) {
  const [period, setPeriod] = useState<'7d' | '30d'>('30d')
  const [activeMarker, setActiveMarker] = useState<number | null>(1)
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; date: string; cpa: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const data = period === '7d' ? MOCK_DATA_7D : MOCK_DATA_30D

  // Build SVG polyline points and marker positions
  const W = 400, H = 110, PAD_TOP = 10, PAD_BOT = 20
  const chartH = H - PAD_TOP - PAD_BOT
  const minCpa = Math.min(...data.map(d => d.cpa)) - 50
  const maxCpa = Math.max(...data.map(d => d.cpa)) + 50
  const toY = (v: number) => PAD_TOP + chartH - ((v - minCpa) / (maxCpa - minCpa)) * chartH
  const toX = (i: number) => (i / (data.length - 1)) * W

  const points = data.map((d, i) => `${toX(i)},${toY(d.cpa)}`).join(' ')

  const markerPositions = data
    .map((d, i) => d.marker ? { ...d, x: toX(i), y: toY(d.cpa), marker: d.marker } : null)
    .filter((m): m is NonNullable<typeof m> => m !== null)

  function handleSvgMove(e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const relX = ((clientX - rect.left) / rect.width) * W
    // Find closest data point
    let closest = 0
    let minDist = Infinity
    for (let i = 0; i < data.length; i++) {
      const dist = Math.abs(toX(i) - relX)
      if (dist < minDist) { minDist = dist; closest = i }
    }
    const d = data[closest]
    setHoverPoint({ x: toX(closest), y: toY(d.cpa), date: d.date, cpa: d.cpa })
  }

  function handleSvgLeave() {
    setHoverPoint(null)
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm shadow-blue-500/5 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50/50">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-400" />
          </div>
          <div className="ml-4 flex-1 rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-400 font-mono hidden sm:block">
            tweaklog.io/dashboard
          </div>
        </div>
        {/* Dashboard content */}
        <div className="p-3 sm:p-4 md:p-6">
          {/* KPI cards with hover */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
            {[
              { label: 'CPA', value: '¥2,340', change: '-12.3%', positive: true },
              { label: 'Cost', value: '¥128,500', change: '+2.1%', positive: false },
              { label: 'CVR', value: '3.2%', change: '+0.4%', positive: true },
            ].map((kpi, i) => (
              <div
                key={kpi.label}
                className={`rounded-lg border border-gray-100 p-2 sm:p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-200 cursor-default ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">{kpi.label}</div>
                <div className="text-sm sm:text-lg font-bold text-gray-900">{kpi.value}</div>
                <div className={`text-[10px] sm:text-xs font-medium ${kpi.positive ? 'text-green-600' : 'text-gray-500'}`}>{kpi.change}</div>
              </div>
            ))}
          </div>
          {/* Chart */}
          <div className="rounded-lg border border-gray-100 p-2 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-medium text-gray-700">Performance Trend</span>
              <div className="flex gap-0.5 rounded-md bg-gray-100 p-0.5">
                {(['7d', '30d'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setPeriod(p); setActiveMarker(null); setHoverPoint(null) }}
                    className={`rounded px-2 py-0.5 text-[9px] sm:text-[10px] font-medium transition-all ${
                      period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto cursor-crosshair"
                onMouseMove={handleSvgMove}
                onMouseLeave={handleSvgLeave}
                onTouchMove={handleSvgMove}
              >
                {/* Grid lines */}
                <line x1="0" y1={PAD_TOP} x2={W} y2={PAD_TOP} stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1={PAD_TOP + chartH / 2} x2={W} y2={PAD_TOP + chartH / 2} stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1={PAD_TOP + chartH} x2={W} y2={PAD_TOP + chartH} stroke="#f1f5f9" strokeWidth="1" />
                {/* Area fill */}
                <polygon
                  points={`0,${PAD_TOP + chartH} ${points} ${W},${PAD_TOP + chartH}`}
                  fill="url(#mockGradient)"
                />
                <defs>
                  <linearGradient id="mockGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Line */}
                <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Hover line + point */}
                {hoverPoint && (
                  <>
                    <line x1={hoverPoint.x} y1={PAD_TOP} x2={hoverPoint.x} y2={PAD_TOP + chartH} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                    <circle cx={hoverPoint.x} cy={hoverPoint.y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                  </>
                )}
                {/* Change markers */}
                {markerPositions.map((m) => {
                  const markerDef = MARKERS.find(mk => mk.id === m.marker)!
                  return (
                    <g key={m.marker} className="cursor-pointer" onClick={() => setActiveMarker(activeMarker === m.marker ? null : m.marker)}>
                      <line x1={m.x} y1={m.y} x2={m.x} y2={PAD_TOP + chartH} stroke={markerDef.color} strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
                      <circle cx={m.x} cy={m.y} r="6" fill={markerDef.color} stroke="white" strokeWidth="2" />
                      <text x={m.x} y={H - 2} textAnchor="middle" fontSize="7" fill="#94a3b8">{m.date}</text>
                    </g>
                  )
                })}
              </svg>
              {/* Hover tooltip */}
              {hoverPoint && (
                <div
                  className="pointer-events-none absolute z-10"
                  style={{ left: `${(hoverPoint.x / W) * 100}%`, top: `${((hoverPoint.y - 28) / H) * 100}%` }}
                >
                  <div className="-translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-[9px] text-white shadow whitespace-nowrap">
                    {hoverPoint.date} &middot; ¥{hoverPoint.cpa.toLocaleString()}
                  </div>
                </div>
              )}
              {/* Marker tooltips */}
              {markerPositions.map((m) => {
                if (activeMarker !== m.marker) return null
                const markerDef = MARKERS.find(mk => mk.id === m.marker)!
                const borderColor = m.marker === 1 ? 'border-purple-200' : m.marker === 2 ? 'border-orange-200' : 'border-green-200'
                const textColor = m.marker === 1 ? 'text-purple-700' : m.marker === 2 ? 'text-orange-700' : 'text-green-700'
                return (
                  <div
                    key={m.marker}
                    className="absolute z-20"
                    style={{ left: `${(m.x / W) * 100}%`, top: `${((m.y - 8) / H) * 100}%` }}
                  >
                    <div className={`-translate-x-1/2 -translate-y-full rounded-lg border ${borderColor} bg-white px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-md`}>
                      <div className={`text-[9px] sm:text-[10px] font-medium ${textColor}`}>{t(`landing.mock.${markerDef.labelKey}`)}</div>
                      <div className="text-[9px] sm:text-[10px] text-gray-600 whitespace-nowrap">{t(`landing.mock.${markerDef.tooltipKey}`)}</div>
                      <div className={`absolute left-1/2 -translate-x-1/2 -bottom-1 h-2 w-2 rotate-45 border-b border-r ${borderColor} bg-white`} />
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3">
              {MARKERS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMarker(activeMarker === m.id ? null : m.id)}
                  className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                >
                  <div className={`h-2 w-2 rounded-full ${m.dotClass}`} />
                  <span className="text-[8px] sm:text-[10px] text-gray-500">{t(`landing.mock.${m.labelKey}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 blur-2xl" />
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 sm:py-5 text-left"
      >
        <span className="text-sm sm:text-base font-medium text-gray-900 pr-4">{question}</span>
        <ChevronDown className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 pb-4 sm:pb-5' : 'max-h-0'}`}>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  async function handleCheckout(plan: 'pro' | 'team') {
    if (!userId) {
      router.push('/signup')
      return
    }
    setCheckoutLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      router.push('/signup')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const platforms = ['Google Ads', 'Meta Ads', 'Yahoo! Ads', 'TikTok Ads', 'LINE Ads', 'Microsoft Ads', 'X Ads']

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 md:px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-xl font-bold text-gray-900">Tweaklog</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              {t('landing.nav.features')}
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              {t('landing.nav.pricing')}
            </a>
            {userId ? (
              <Link href="/post-login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t('nav.dashboard')}
              </Link>
            ) : (
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t('landing.nav.login')}
              </Link>
            )}
            <LanguageSwitcher />
            {userId ? (
              <Link
                href="/post-login"
                className="rounded-lg bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-4 py-2 text-sm font-medium text-white hover:shadow-sm hover:shadow-indigo-500/15 transition-all duration-200"
              >
                {t('nav.dashboard')}
              </Link>
            ) : (
              <Link
                href="/signup"
                className="rounded-lg bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-4 py-2 text-sm font-medium text-white hover:shadow-sm hover:shadow-indigo-500/15 transition-all duration-200"
              >
                {t('landing.nav.startFree')}
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center gap-3 md:hidden">
            <LanguageSwitcher />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600 py-2">
              {t('landing.nav.features')}
            </a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600 py-2">
              {t('landing.nav.pricing')}
            </a>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600 py-2">
              {t('landing.nav.login')}
            </Link>
            <Link
              href="/signup"
              className="block rounded-lg bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              {t('landing.nav.startFree')}
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] sm:h-[600px] w-[600px] sm:w-[800px] rounded-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 blur-3xl opacity-60" />
        </div>

        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-12 md:mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-[2.75rem] lg:text-5xl font-bold leading-tight tracking-tight mb-4 sm:mb-6 bg-gradient-to-r from-[#2563EB] to-[#9333EA] bg-clip-text text-transparent">
              {t('landing.hero.headlineLine1')}<br />
              {t('landing.hero.headlineLine2')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-blue-600 font-medium mb-4 sm:mb-6">
              {t('landing.hero.tagline')}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed mb-8 sm:mb-10 max-w-3xl mx-auto break-words">
              {t('landing.hero.subheadline')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-6 py-3 text-base font-medium text-white hover:shadow-sm hover:shadow-indigo-500/15 transition-all duration-200 shadow-sm shadow-indigo-500/10"
              >
                {t('landing.hero.cta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('landing.hero.secondaryCta')}
              </a>
            </div>
          </div>

          <DashboardMockup t={t} />
        </div>
      </section>

      {/* Pain Points */}
      <Section className="py-12 sm:py-16 md:py-24 bg-gray-50/50">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12 break-words">
            {t('landing.painPoints.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              { titleKey: 'problem1Title', descKey: 'problem1Desc', solutionKey: 'solution1', icon: ClipboardList },
              { titleKey: 'problem2Title', descKey: 'problem2Desc', solutionKey: 'solution2', icon: BarChart3 },
              { titleKey: 'problem3Title', descKey: 'problem3Desc', solutionKey: 'solution3', icon: Sparkles },
            ].map(({ titleKey, descKey, solutionKey, icon: Icon }) => (
              <div key={titleKey} className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 md:p-8">
                <div className="mb-3 sm:mb-4 inline-flex rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 p-2.5">
                  <Icon className="h-5 w-5 text-[#2563EB]" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  {t(`landing.painPoints.${titleKey}`)}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 leading-relaxed">
                  {t(`landing.painPoints.${descKey}`)}
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-600">
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  {t(`landing.painPoints.${solutionKey}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Features */}
      <Section className="py-16 sm:py-20 md:py-28" id="features">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 break-words">
              {t('landing.features.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {t('landing.features.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { key: 'changelog', icon: ClipboardList, color: 'blue' },
              { key: 'impact', icon: BarChart3, color: 'purple' },
              { key: 'ai', icon: MessageSquareText, color: 'emerald' },
              { key: 'dashboard', icon: LayoutDashboard, color: 'orange' },
            ].map(({ key, icon: Icon, color }) => {
              const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
                blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
                purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
                emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
                orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
              }
              const c = colorMap[color]
              return (
                <div key={key} className={`rounded-xl border-2 ${c.border} bg-white p-5 sm:p-6 md:p-8 hover:border-[#2563EB] transition-colors duration-200 overflow-hidden`}>
                  <div className="mb-3 sm:mb-4 inline-flex rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 p-2.5">
                    <Icon className={`h-5 w-5 ${c.icon}`} />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                    {t(`landing.features.${key}.title`)}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                    {t(`landing.features.${key}.subtitle`)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t(`landing.features.${key}.desc`)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* Integrations */}
      <Section className="py-16 sm:py-20 md:py-28 bg-gray-50/50">
        <div className="mx-auto max-w-6xl px-4 md:px-6 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 break-words">
            {t('landing.integrations.title')}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto">
            {t('landing.integrations.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-10">
            <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <Upload className="h-5 w-5 text-blue-600 shrink-0" />
              <span className="text-sm font-medium text-gray-700">{t('landing.integrations.csv')}</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <Sheet className="h-5 w-5 text-green-600 shrink-0" />
              <span className="text-sm font-medium text-gray-700">{t('landing.integrations.spreadsheet')}</span>
            </div>
          </div>

          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
            {t('landing.integrations.supportedPlatforms')}
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-full border border-gray-200 bg-white px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section className="py-16 sm:py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12 break-words">
            {t('landing.howItWorks.title')}
          </h2>
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-8 max-w-md sm:max-w-none mx-auto">
            {[
              { step: 1, icon: Database, titleKey: 'step1Title', descKey: 'step1Desc' },
              { step: 2, icon: PenLine, titleKey: 'step2Title', descKey: 'step2Desc' },
              { step: 3, icon: Sparkles, titleKey: 'step3Title', descKey: 'step3Desc' },
            ].map(({ step, icon: Icon, titleKey, descKey }) => (
              <div key={step} className="flex items-start gap-4 sm:flex-col sm:items-center sm:text-center rounded-xl border border-gray-100 bg-white p-4 sm:p-6 sm:border-0 sm:bg-transparent">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#9333EA] text-white font-bold text-base sm:text-lg shadow-sm shadow-indigo-500/10">
                    {step}
                  </div>
                  <div className="hidden sm:inline-flex rounded-lg bg-blue-50 p-2.5">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:justify-center mb-1 sm:mb-2">
                    <div className="sm:hidden inline-flex rounded-lg bg-blue-50 p-1.5">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
                      {t(`landing.howItWorks.${titleKey}`)}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t(`landing.howItWorks.${descKey}`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* MCP / Agent AI */}
      <Section className="py-16 sm:py-20 md:py-28 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 break-words">
              エージェントAIが、直接つながる。
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed break-words">
              MCP (Model Context Protocol) 対応。Claude Desktop や OpenClaw などのAIエージェントが、Tweaklog に直接アクセスして変更ログの記録・分析ができます。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-14">
            {[
              {
                icon: Pencil,
                title: '自動で記録',
                desc: 'AIエージェントが広告を変更したら、Tweaklogに自動で変更ログを書き込み。手動入力ゼロ。',
              },
              {
                icon: BarChart3,
                title: '即座に分析',
                desc: 'エージェントがKPIデータを取得して、変更のインパクトをリアルタイムで判断。',
              },
              {
                icon: Cpu,
                title: 'どのAIでも',
                desc: 'MCP標準プロトコル対応。Claude Desktop, OpenClaw, その他MCP対応エージェントですぐ使える。',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 max-w-3xl mx-auto">
            <div className="w-full md:flex-1 rounded-xl bg-slate-900 p-4 sm:p-6 font-mono text-xs sm:text-sm text-green-400 overflow-x-auto max-w-full">
              <pre className="whitespace-pre">{`{
  "mcpServers": {
    "tweaklog": {
      "url": "https://tweaklog.io/api/mcp/mcp"
    }
  }
}`}</pre>
            </div>
            <p className="text-sm sm:text-base text-slate-600 md:max-w-[200px] text-center md:text-left leading-relaxed">
              この設定をClaude Desktopに追加するだけ。
            </p>
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section className="py-16 sm:py-20 md:py-28 bg-gray-50/50" id="pricing">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 break-words">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {t('landing.pricing.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto pt-2">
            {/* Free */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 md:p-8 overflow-hidden">
              <h3 className="text-lg font-bold text-gray-900">{t('landing.pricing.free.name')}</h3>
              <div className="mt-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{t('landing.pricing.free.price')}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">{t('landing.pricing.free.desc')}</p>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {(['feature1', 'feature2', 'feature3', 'feature4', 'feature5'] as const).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{t(`landing.pricing.free.${f}`)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('landing.pricing.cta')}
              </Link>
            </div>

            {/* Pro — order-first on mobile so it appears at top */}
            <div className="rounded-xl border-2 border-[#2563EB] bg-white p-5 sm:p-6 md:p-8 relative order-first md:order-none shadow-sm shadow-blue-500/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-3 py-0.5 text-xs font-medium text-white">
                {t('landing.pricing.popular')}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('landing.pricing.pro.name')}</h3>
              <div className="mt-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{t('landing.pricing.pro.price')}</span>
                <span className="text-xs sm:text-sm text-gray-500">{t('landing.pricing.pro.priceUnit')}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">{t('landing.pricing.pro.desc')}</p>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {(['feature1', 'feature2', 'feature3', 'feature4', 'feature5'] as const).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                    <Check className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{t(`landing.pricing.pro.${f}`)}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout('pro')}
                disabled={checkoutLoading === 'pro'}
                className="block w-full rounded-lg bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-4 py-2.5 text-center text-sm font-medium text-white hover:shadow-sm hover:shadow-indigo-500/15 transition-all duration-200 disabled:opacity-50"
              >
                {checkoutLoading === 'pro' ? t('common.loading') : t('billing.tryFree')}
              </button>
            </div>

            {/* Team */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 md:p-8 overflow-hidden">
              <h3 className="text-lg font-bold text-gray-900">{t('landing.pricing.team.name')}</h3>
              <div className="mt-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{t('landing.pricing.team.price')}</span>
                <span className="text-xs sm:text-sm text-gray-500">{t('landing.pricing.team.priceUnit')}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">{t('landing.pricing.team.desc')}</p>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {(['feature1', 'feature2', 'feature3', 'feature4', 'feature5'] as const).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{t(`landing.pricing.team.${f}`)}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout('team')}
                disabled={checkoutLoading === 'team'}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {checkoutLoading === 'team' ? t('common.loading') : t('landing.pricing.cta')}
              </button>
            </div>

            {/* Enterprise */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 md:p-8 overflow-hidden">
              <h3 className="text-lg font-bold text-gray-900">{t('landing.pricing.enterprise.name')}</h3>
              <div className="mt-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{t('landing.pricing.enterprise.price')}</span>
                <span className="text-xs sm:text-sm text-gray-500">{t('landing.pricing.enterprise.priceUnit')}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">{t('landing.pricing.enterprise.desc')}</p>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {(['feature1', 'feature2', 'feature3', 'feature4', 'feature5'] as const).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                    <Check className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                    <span>{t(`landing.pricing.enterprise.${f}`)}</span>
                  </li>
                ))}
              </ul>
              <a
                href="mailto:tweaklog41@gmail.com"
                className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('landing.pricing.contactUs')}
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="py-16 sm:py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-10 break-words">
            {t('landing.faq.title')}
          </h2>
          <div>
            <FAQItem question={t('landing.faq.q1')} answer={t('landing.faq.a1')} />
            <FAQItem question={t('landing.faq.q2')} answer={t('landing.faq.a2')} />
            <FAQItem question={t('landing.faq.q3')} answer={t('landing.faq.a3')} />
            <FAQItem question={t('landing.faq.q4')} answer={t('landing.faq.a4')} />
          </div>
        </div>
      </Section>

      {/* Footer CTA */}
      <Section className="py-16 sm:py-20 md:py-28 bg-gradient-to-r from-[#2563EB] to-[#9333EA]">
        <div className="mx-auto max-w-6xl px-4 md:px-6 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 break-words">
            {t('landing.footerCta.headline')}
          </h2>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm sm:text-base font-medium text-[#2563EB] hover:bg-blue-50 transition-colors shadow-sm"
          >
            {t('landing.footerCta.cta')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="text-lg font-bold text-white">Tweaklog</div>
            <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <a href="#features" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                {t('landing.footer.features')}
              </a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                {t('landing.footer.pricing')}
              </a>
              <Link href="/login" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                {t('landing.footer.login')}
              </Link>
              <Link href="/signup" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                {t('landing.footer.signup')}
              </Link>
            </nav>
          </div>
          <div className="mt-6 flex flex-col items-center gap-3">
            <nav className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/commercial-transactions" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                特定商取引法に基づく表記
              </Link>
            </nav>
            <div className="text-xs text-gray-500">
              {t('landing.footer.copyright')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
