'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import BillingSection from '@/components/settings/BillingSection'
import TeamSection from '@/components/settings/TeamSection'
import {
  updateProject,
  updateKpiSettings,
  saveMetricConfig,
  deleteMetricConfig,
  deleteProject,
  createExperimentGroup,
  updateExperimentGroup,
  deleteExperimentGroup,
} from '@/app/(app)/app/[project]/settings/actions'
import { useTranslation } from '@/lib/i18n/config'

// ─── Types ────────────────────────────────────────────────

interface MetricConfig {
  id: string
  name: string
  displayName: string
  formula: string
  improvementDirection: 'up' | 'down'
  sortOrder: number
}

interface ExperimentGroup {
  id: string
  name: string
  status: 'testing' | 'steady' | 'completed'
  campaignPatterns: string[]
  note: string
}

interface Props {
  project: {
    id: string
    name: string
    platform: string[]
    north_star_kpi: string | null
    sub_kpis: string[]
    org_id: string
  }
  orgName: string
  metricConfigs: MetricConfig[]
  customColumnNames: string[]
  experimentGroups: ExperimentGroup[]
  knownCampaigns: string[]
  userId?: string
}

// ─── Constants ────────────────────────────────────────────

const PRESET_PLATFORMS = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'meta', label: 'Meta' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'yahoo_ads', label: 'Yahoo! Ads' },
  { value: 'microsoft_ads', label: 'Microsoft Ads' },
  { value: 'line_ads', label: 'LINE Ads' },
  { value: 'x_ads', label: 'X (Twitter) Ads' },
]

const PRESET_VALUES = new Set(PRESET_PLATFORMS.map((p) => p.value))

const NORTH_STAR_OPTIONS = [
  { value: 'cpa', label: 'CPA (Cost per Acquisition)' },
  { value: 'roas', label: 'ROAS (Return on Ad Spend)' },
  { value: 'cvr', label: 'CVR (Conversion Rate)' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'conversions', label: 'Conversions' },
]

const SUB_KPI_OPTIONS = [
  'impressions', 'clicks', 'ctr', 'cpc', 'cost',
  'conversions', 'cvr', 'cpa', 'roas', 'revenue',
]

const SUB_KPI_LABELS: Record<string, string> = {
  impressions: 'Impressions',
  clicks: 'Clicks',
  ctr: 'CTR',
  cpc: 'CPC',
  cost: 'Cost',
  conversions: 'Conversions',
  cvr: 'CVR',
  cpa: 'CPA',
  roas: 'ROAS',
  revenue: 'Revenue',
}

const METRIC_TEMPLATES = [
  { name: 'ctr', displayName: 'CTR', formula: 'Clicks / Impressions', improvementDirection: 'up' as const },
  { name: 'cpc', displayName: 'CPC', formula: 'Cost / Clicks', improvementDirection: 'down' as const },
  { name: 'cvr', displayName: 'CVR', formula: 'Conversions / Clicks', improvementDirection: 'up' as const },
  { name: 'cpa', displayName: 'CPA', formula: 'Cost / Conversions', improvementDirection: 'down' as const },
  { name: 'roas', displayName: 'ROAS', formula: 'Revenue / Cost', improvementDirection: 'up' as const },
]

const FUNCTIONS_REFERENCE = [
  { name: 'IF(cond, true_val, false_val)', example: 'IF(Revenue > 0, Revenue / Cost, 0)' },
  { name: 'SUM(a, b, ...)', example: 'SUM(CV_A, CV_B)' },
  { name: 'AVG(a, b, ...)', example: 'AVG(CPA_Mon, CPA_Tue)' },
  { name: 'MIN(a, b)', example: 'MIN(CPA, 1000)' },
  { name: 'MAX(a, b)', example: 'MAX(ROAS, 0)' },
]

function validateFormula(formula: string): string | null {
  if (!formula.trim()) return 'Formula cannot be empty'
  let parens = 0
  for (const ch of formula) {
    if (ch === '(') parens++
    if (ch === ')') parens--
    if (parens < 0) return 'Unmatched closing parenthesis'
  }
  if (parens !== 0) return 'Unmatched opening parenthesis'
  return null
}

// ─── Main Component ───────────────────────────────────────

export default function SettingsContent({
  project,
  orgName: initialOrgName,
  metricConfigs: initialMetricConfigs,
  customColumnNames,
  experimentGroups: initialGroups,
  knownCampaigns,
  userId,
}: Props) {
  const router = useRouter()
  const { t } = useTranslation()

  // Section 1 — Project Settings
  const [projectName, setProjectName] = useState(project.name)
  const [orgName, setOrgName] = useState(initialOrgName)
  const [platforms, setPlatforms] = useState<string[]>(project.platform)
  const [projectSaving, setProjectSaving] = useState(false)
  const [customPlatformInput, setCustomPlatformInput] = useState('')

  // Section 2 — KPI Settings
  const [northStarKpi, setNorthStarKpi] = useState(project.north_star_kpi ?? '')
  const [customNorthStar, setCustomNorthStar] = useState(
    project.north_star_kpi && !NORTH_STAR_OPTIONS.some((o) => o.value === project.north_star_kpi)
      ? project.north_star_kpi
      : ''
  )
  const [subKpis, setSubKpis] = useState<string[]>(project.sub_kpis)
  const [kpiSaving, setKpiSaving] = useState(false)

  // Section 3 — Custom Metrics
  const [metricConfigs, setMetricConfigs] = useState<MetricConfig[]>(initialMetricConfigs)
  const [showEditor, setShowEditor] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editorName, setEditorName] = useState('')
  const [editorDisplayName, setEditorDisplayName] = useState('')
  const [editorFormula, setEditorFormula] = useState('')
  const [editorDirection, setEditorDirection] = useState<'up' | 'down'>('up')
  const [formulaError, setFormulaError] = useState<string | null>(null)
  const [metricSaving, setMetricSaving] = useState(false)
  const [showReference, setShowReference] = useState(false)
  const formulaRef = useRef<HTMLTextAreaElement>(null)

  // Section 4 — Experiment Groups
  const [groups, setGroups] = useState<ExperimentGroup[]>(initialGroups)
  const [showGroupEditor, setShowGroupEditor] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [groupStatus, setGroupStatus] = useState<'testing' | 'steady' | 'completed'>('testing')
  const [groupPatterns, setGroupPatterns] = useState<string[]>([])
  const [groupCampaignSearch, setGroupCampaignSearch] = useState('')
  const [groupNote, setGroupNote] = useState('')
  const [groupSaving, setGroupSaving] = useState(false)

  // Section 5 — Danger Zone
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  const isCustomNorthStar = northStarKpi !== '' && !NORTH_STAR_OPTIONS.some((o) => o.value === northStarKpi)

  const allVariables = [
    'Impressions', 'Clicks', 'Cost', 'Conversions', 'Revenue',
    ...customColumnNames.filter(
      (v) => !['Impressions', 'Clicks', 'Cost', 'Conversions', 'Revenue'].includes(v)
    ),
  ]

  // Formula preview
  const [preview, setPreview] = useState<{ date: string; value: number | null; error: string | null }[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  const fetchPreview = useCallback(
    async (formula: string) => {
      if (!formula.trim() || validateFormula(formula) !== null) {
        setPreview([])
        return
      }
      setPreviewLoading(true)
      try {
        const res = await fetch('/api/metric-configs/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project.id, formula }),
        })
        if (res.ok) {
          const data = await res.json()
          setPreview(data.preview ?? [])
        }
      } catch {
        // ignore fetch errors silently
      } finally {
        setPreviewLoading(false)
      }
    },
    [project.id]
  )

  // Debounce formula preview requests (500ms)
  useEffect(() => {
    if (!showEditor || !editorFormula.trim()) {
      setPreview([])
      return
    }
    const timer = setTimeout(() => fetchPreview(editorFormula), 500)
    return () => clearTimeout(timer)
  }, [editorFormula, showEditor, fetchPreview])

  // Delete modal animation
  useEffect(() => {
    if (showDeleteModal) {
      requestAnimationFrame(() => setDeleteModalVisible(true))
    } else {
      setDeleteModalVisible(false)
    }
  }, [showDeleteModal])

  // ─── Handlers ─────────────────────────────────────────

  async function handleSaveProject() {
    setProjectSaving(true)
    const result = await updateProject(project.id, {
      name: projectName,
      orgName,
      platforms,
    })
    setProjectSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(t('settings.projectSaved'))
    }
  }

  async function handleSaveKpi() {
    setKpiSaving(true)
    const resolvedKpi = isCustomNorthStar ? customNorthStar : northStarKpi
    const result = await updateKpiSettings(project.id, {
      northStarKpi: resolvedKpi,
      subKpis,
    })
    setKpiSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(t('settings.kpiSaved'))
    }
  }

  function togglePlatform(p: string) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  function addCustomPlatform() {
    const name = customPlatformInput.trim()
    if (!name) return
    const value = name.toLowerCase().replace(/\s+/g, '_')
    if (!platforms.includes(value)) {
      setPlatforms((prev) => [...prev, value])
    }
    setCustomPlatformInput('')
  }

  function toggleSubKpi(kpi: string) {
    setSubKpis((prev) => {
      if (prev.includes(kpi)) return prev.filter((k) => k !== kpi)
      if (prev.length >= 5) return prev
      return [...prev, kpi]
    })
  }

  function openEditor(config?: MetricConfig) {
    if (config) {
      setEditingId(config.id)
      setEditorName(config.name)
      setEditorDisplayName(config.displayName)
      setEditorFormula(config.formula)
      setEditorDirection(config.improvementDirection)
    } else {
      setEditingId(null)
      setEditorName('')
      setEditorDisplayName('')
      setEditorFormula('')
      setEditorDirection('up')
    }
    setFormulaError(null)
    setShowEditor(true)
  }

  function closeEditor() {
    setShowEditor(false)
    setEditingId(null)
    setFormulaError(null)
  }

  function applyTemplate(tpl: typeof METRIC_TEMPLATES[number]) {
    setEditorName(tpl.name)
    setEditorDisplayName(tpl.displayName)
    setEditorFormula(tpl.formula)
    setEditorDirection(tpl.improvementDirection)
    setFormulaError(null)
    setShowEditor(true)
    setEditingId(null)
  }

  function insertVariable(v: string) {
    if (!formulaRef.current) {
      setEditorFormula((prev) => prev + v)
      return
    }
    const ta = formulaRef.current
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = editorFormula.slice(0, start)
    const after = editorFormula.slice(end)
    setEditorFormula(before + v + after)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + v.length
    })
  }

  async function handleSaveMetric() {
    const error = validateFormula(editorFormula)
    if (error) {
      setFormulaError(error)
      return
    }
    if (!editorName.trim() || !editorDisplayName.trim()) {
      setFormulaError(t('settings.nameRequired'))
      return
    }
    setMetricSaving(true)
    const result = await saveMetricConfig(project.id, {
      id: editingId ?? undefined,
      name: editorName,
      displayName: editorDisplayName,
      formula: editorFormula,
      improvementDirection: editorDirection,
    })
    setMetricSaving(false)
    if (result.error) {
      setFormulaError(result.error)
    } else {
      toast.success(editingId ? t('settings.metricUpdated') : t('settings.metricAdded'))
      closeEditor()
      router.refresh()
    }
  }

  async function handleDeleteMetric(configId: string) {
    if (!confirm(t('settings.deleteMetricConfirm'))) return
    await deleteMetricConfig(configId, project.id)
    setMetricConfigs((prev) => prev.filter((m) => m.id !== configId))
    toast.success(t('settings.metricDeleted'))
    router.refresh()
  }

  function openGroupEditor(group?: ExperimentGroup) {
    if (group) {
      setEditingGroupId(group.id)
      setGroupName(group.name)
      setGroupStatus(group.status)
      setGroupPatterns([...group.campaignPatterns])
      setGroupNote(group.note)
    } else {
      setEditingGroupId(null)
      setGroupName('')
      setGroupStatus('testing')
      setGroupPatterns([])
      setGroupNote('')
    }
    setGroupCampaignSearch('')
    setShowGroupEditor(true)
  }

  function closeGroupEditor() {
    setShowGroupEditor(false)
    setEditingGroupId(null)
  }

  function toggleGroupCampaign(campaign: string) {
    setGroupPatterns((prev) =>
      prev.includes(campaign) ? prev.filter((p) => p !== campaign) : [...prev, campaign]
    )
  }

  async function handleSaveGroup() {
    if (!groupName.trim()) {
      toast.error(t('settings.groupNameRequired'))
      return
    }
    setGroupSaving(true)
    if (editingGroupId) {
      const result = await updateExperimentGroup(editingGroupId, project.id, {
        name: groupName,
        status: groupStatus,
        campaignPatterns: groupPatterns,
        note: groupNote,
      })
      setGroupSaving(false)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(t('settings.groupUpdated'))
        setGroups((prev) => prev.map((g) => g.id === editingGroupId ? { ...g, name: groupName, status: groupStatus, campaignPatterns: groupPatterns, note: groupNote } : g))
        closeGroupEditor()
        router.refresh()
      }
    } else {
      const result = await createExperimentGroup(project.id, {
        name: groupName,
        status: groupStatus,
        campaignPatterns: groupPatterns,
        note: groupNote,
      })
      setGroupSaving(false)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(t('settings.groupCreated'))
        closeGroupEditor()
        router.refresh()
      }
    }
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm(t('settings.deleteGroupConfirm'))) return
    const result = await deleteExperimentGroup(groupId, project.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      toast.success(t('settings.groupDeleted'))
      router.refresh()
    }
  }

  async function handleDeleteProject() {
    setDeleting(true)
    await deleteProject(project.id)
    // deleteProject redirects on success, so this only runs on error
    setDeleting(false)
  }

  // ─── Render ───────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8 p-4 sm:p-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('settings.description')}
        </p>
      </div>

      {/* ── Billing Section ───────────────────────────── */}
      {userId && <BillingSection userId={userId} />}

      {/* ── Team Section ────────────────────────────── */}
      {userId && <TeamSection orgId={project.org_id} currentUserId={userId} />}

      {/* ── Section 1: Project Settings ──────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('settings.projectSettings')}</h2>
        </div>
        <div className="space-y-5 px-4 sm:px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('settings.projectName')}</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('settings.organizationName')}</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.platforms')}</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_PLATFORMS.map((p) => {
                const active = platforms.includes(p.value)
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePlatform(p.value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
              {platforms.filter((p) => !PRESET_VALUES.has(p)).map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                >
                  {p}
                  <button
                    type="button"
                    onClick={() => setPlatforms((prev) => prev.filter((x) => x !== p))}
                    className="ml-0.5 text-slate-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={customPlatformInput}
                onChange={(e) => setCustomPlatformInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomPlatform()
                  }
                }}
                placeholder={t('settings.customPlatformPlaceholder')}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <button
                type="button"
                onClick={addCustomPlatform}
                disabled={!customPlatformInput.trim()}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-50 disabled:opacity-40"
              >
                {t('settings.addCustomPlatform')}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveProject}
              disabled={projectSaving}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-sm hover:shadow-indigo-500/15 disabled:opacity-50"
            >
              {projectSaving ? t('settings.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 2: KPI Settings ──────────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('settings.mainKpiSettings')}</h2>
        </div>
        <div className="space-y-5 px-4 sm:px-6 py-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('dashboard.mainKpi')}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {t('settings.mainKpiDescription')}
            </p>
            <select
              value={isCustomNorthStar ? '__custom__' : northStarKpi}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setNorthStarKpi('__custom__')
                  setCustomNorthStar('')
                } else {
                  setNorthStarKpi(e.target.value)
                  setCustomNorthStar('')
                }
              }}
              className="block w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">{t('settings.selectKpi')}</option>
              {NORTH_STAR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
              <option value="__custom__">{t('settings.customOption')}</option>
            </select>
            {(isCustomNorthStar || northStarKpi === '__custom__') && (
              <input
                type="text"
                value={customNorthStar}
                onChange={(e) => {
                  setCustomNorthStar(e.target.value)
                  setNorthStarKpi(e.target.value)
                }}
                placeholder="e.g. gross_profit_roas"
                className="mt-2 block w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('settings.subKpis')}
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                ({t('settings.max5')}, {subKpis.length} {t('settings.selected')})
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SUB_KPI_OPTIONS
                .filter((k) => k !== northStarKpi)
                .map((kpi) => {
                  const active = subKpis.includes(kpi)
                  const disabled = !active && subKpis.length >= 5
                  return (
                    <button
                      key={kpi}
                      type="button"
                      onClick={() => toggleSubKpi(kpi)}
                      disabled={disabled}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 ${
                        active
                          ? 'border-indigo-500 bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                          : disabled
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {SUB_KPI_LABELS[kpi] ?? kpi}
                    </button>
                  )
                })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveKpi}
              disabled={kpiSaving}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-sm hover:shadow-indigo-500/15 disabled:opacity-50"
            >
              {kpiSaving ? t('settings.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 3: Custom Metrics ────────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{t('settings.customMetrics')}</h2>
            <button
              type="button"
              onClick={() => openEditor()}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:shadow-sm hover:shadow-indigo-500/15"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t('settings.addMetric')}
            </button>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-5">
          {/* Templates */}
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">
              {t('settings.quickAddTemplate')}
            </p>
            <div className="flex flex-wrap gap-2">
              {METRIC_TEMPLATES.map((tpl) => {
                const exists = metricConfigs.some((m) => m.name === tpl.name)
                return (
                  <button
                    key={tpl.name}
                    type="button"
                    disabled={exists}
                    onClick={() => applyTemplate(tpl)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                      exists
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {tpl.displayName}
                    <span className="ml-1.5 font-mono text-[10px] text-gray-400">{tpl.formula}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Existing metrics list */}
          {metricConfigs.length > 0 ? (
            <div className="space-y-2">
              {metricConfigs.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{m.displayName}</span>
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 truncate max-w-[140px] sm:max-w-[200px]">
                      {m.formula}
                    </code>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      {m.improvementDirection === 'up' ? t('settings.higherShort') : t('settings.lowerShort')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditor(m)}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMetric(m.id)}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !showEditor ? (
            <p className="text-sm text-gray-400 text-center py-6">
              {t('settings.noMetrics')}
            </p>
          ) : null}

          {/* Inline metric editor */}
          {showEditor && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {editingId ? t('settings.editMetric') : t('settings.newMetric')}
                </h3>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">{t('settings.internalName')}</label>
                  <input
                    type="text"
                    value={editorName}
                    onChange={(e) => setEditorName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="gross_profit_roas"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">{t('settings.displayName')}</label>
                  <input
                    type="text"
                    value={editorDisplayName}
                    onChange={(e) => setEditorDisplayName(e.target.value)}
                    placeholder="Gross Profit ROAS"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
              </div>

              {/* Formula */}
              <div>
                <label className="block text-xs font-medium text-gray-600">{t('settings.formula')}</label>
                <textarea
                  ref={formulaRef}
                  value={editorFormula}
                  onChange={(e) => {
                    setEditorFormula(e.target.value)
                    setFormulaError(null)
                  }}
                  rows={2}
                  placeholder="(Revenue - COGS) / Cost"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${
                    formulaError
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-slate-500 focus:ring-slate-500'
                  }`}
                />
                {formulaError && (
                  <p className="mt-1 text-xs text-red-600">{formulaError}</p>
                )}
              </div>

              {/* Variable chips */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">{t('settings.clickToInsert')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {allVariables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Functions reference (collapsible) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowReference(!showReference)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <svg className={`h-3 w-3 transition-transform ${showReference ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  {t('settings.availableFunctions')}
                </button>
                {showReference && (
                  <div className="mt-2 rounded-lg bg-white border border-gray-200 p-3">
                    {FUNCTIONS_REFERENCE.map((f) => (
                      <div key={f.name} className="text-xs font-mono text-gray-600 py-0.5">
                        <span className="text-purple-600">{f.name}</span>
                        {' — '}
                        <span className="text-gray-400">{f.example}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Real-time preview */}
              {(preview.length > 0 || previewLoading) && (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500">{t('settings.previewDays')}</p>
                    {previewLoading && (
                      <span className="text-[10px] text-gray-400 animate-pulse">{t('settings.calculating')}</span>
                    )}
                  </div>
                  {preview.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                      {preview.map((p) => (
                        <div key={p.date} className="text-center">
                          <div className="text-[10px] text-gray-400">
                            {new Date(p.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className={`text-xs font-mono font-medium mt-0.5 ${
                            p.error ? 'text-red-500' : p.value !== null ? 'text-green-600' : 'text-gray-300'
                          }`}>
                            {p.error ? 'ERR' : p.value !== null ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : previewLoading ? (
                    <div className="h-8 flex items-center justify-center">
                      <span className="text-xs text-gray-400">{t('settings.loadingData')}</span>
                    </div>
                  ) : null}
                  {preview.length > 0 && !preview.some((p) => p.error) && preview.some((p) => p.value !== null) && (
                    <div className="mt-2 flex items-end gap-px h-8">
                      {(() => {
                        const values = preview.map((p) => p.value).filter((v): v is number => v !== null)
                        const max = Math.max(...values)
                        const min = Math.min(...values)
                        const range = max - min || 1
                        return preview.map((p) => (
                          <div key={p.date} className="flex-1 flex items-end">
                            <div
                              className="w-full rounded-sm bg-green-200"
                              style={{
                                height: p.value !== null
                                  ? `${Math.max(4, ((p.value - min) / range) * 28 + 4)}px`
                                  : '4px',
                                opacity: p.value !== null ? 1 : 0.3,
                              }}
                            />
                          </div>
                        ))
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Improvement direction */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {t('settings.improvementDirection')}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      checked={editorDirection === 'up'}
                      onChange={() => setEditorDirection('up')}
                      className="text-slate-900 focus:ring-slate-500"
                    />
                    <span className="text-gray-700">{t('settings.higherBetter')}</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      checked={editorDirection === 'down'}
                      onChange={() => setEditorDirection('down')}
                      className="text-slate-900 focus:ring-slate-500"
                    />
                    <span className="text-gray-700">{t('settings.lowerBetter')}</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSaveMetric}
                  disabled={metricSaving}
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-sm hover:shadow-indigo-500/15 disabled:opacity-50"
                >
                  {metricSaving ? t('settings.saving') : editingId ? t('settings.updateMetric') : t('settings.addMetric')}
                </button>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 4: Experiment Groups ────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">{t('settings.experimentGroups')}</h2>
              <p className="mt-0.5 text-xs text-gray-500">{t('settings.experimentGroupsDescription')}</p>
            </div>
            <button
              type="button"
              onClick={() => openGroupEditor()}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:shadow-sm hover:shadow-indigo-500/15"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t('settings.addGroup')}
            </button>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-5">
          {groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{g.name}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      g.status === 'testing' ? 'bg-blue-100 text-blue-700' :
                      g.status === 'completed' ? 'bg-green-50 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {t('settings.' + g.status)}
                    </span>
                    {g.campaignPatterns.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {g.campaignPatterns.length} {t('settings.campaignPatterns')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openGroupEditor(g)}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(g.id)}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !showGroupEditor ? (
            <p className="text-sm text-gray-400 text-center py-6">
              {t('settings.noGroups')}
            </p>
          ) : null}

          {/* Inline group editor */}
          {showGroupEditor && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {editingGroupId ? t('settings.editGroup') : t('settings.newGroup')}
                </h3>
                <button
                  type="button"
                  onClick={closeGroupEditor}
                  className="rounded p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">{t('settings.groupName')}</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder={t('settings.groupNamePlaceholder')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">{t('settings.status')}</label>
                  <div className="mt-1 flex gap-2">
                    {(['testing', 'steady', 'completed'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setGroupStatus(s)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150 ${
                          groupStatus === s
                            ? s === 'testing' ? 'border-blue-500 bg-blue-100 text-blue-700'
                              : s === 'completed' ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-slate-500 bg-slate-50 text-slate-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t('settings.' + s)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Campaign picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-600">
                    {t('settings.campaigns')}
                  </label>
                  {knownCampaigns.length > 0 && (
                    <span className="text-[10px] font-medium text-gray-400 tabular-nums">
                      {groupPatterns.length} / {knownCampaigns.length} {t('settings.selected')}
                    </span>
                  )}
                </div>

                {knownCampaigns.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-5 text-center">
                    <p className="text-xs text-gray-500">{t('settings.csvImportHint')}</p>
                  </div>
                ) : (
                  <>
                    {/* Selected campaigns chips */}
                    {groupPatterns.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {groupPatterns.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                          >
                            {c}
                            <button
                              type="button"
                              onClick={() => toggleGroupCampaign(c)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Search input */}
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                      <input
                        type="text"
                        value={groupCampaignSearch}
                        onChange={(e) => setGroupCampaignSearch(e.target.value)}
                        placeholder="キャンペーンを検索..."
                        className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                    </div>

                    {/* Select all / Deselect all */}
                    {(() => {
                      const filteredCampaigns = knownCampaigns.filter((c) =>
                        c.toLowerCase().includes(groupCampaignSearch.toLowerCase())
                      )
                      const allFilteredSelected = filteredCampaigns.length > 0 && filteredCampaigns.every((c) => groupPatterns.includes(c))
                      return (
                        <>
                          <div className="mt-1.5 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const toAdd = filteredCampaigns.filter((c) => !groupPatterns.includes(c))
                                if (toAdd.length > 0) setGroupPatterns((prev) => [...prev, ...toAdd])
                              }}
                              disabled={allFilteredSelected}
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              {t('settings.selectAll')}{groupCampaignSearch ? ` (${t('common.filter')})` : ''}
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                const toRemove = new Set(filteredCampaigns)
                                setGroupPatterns((prev) => prev.filter((p) => !toRemove.has(p)))
                              }}
                              disabled={!filteredCampaigns.some((c) => groupPatterns.includes(c))}
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              {t('settings.deselectAll')}{groupCampaignSearch ? ` (${t('common.filter')})` : ''}
                            </button>
                          </div>

                          {/* Checkbox list */}
                          <div className="mt-1.5 max-h-[200px] overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                            {filteredCampaigns.length === 0 ? (
                              <p className="px-3 py-3 text-xs text-gray-400 text-center">{t('settings.noMatchingCampaigns')}</p>
                            ) : (
                              filteredCampaigns.map((c) => (
                                <label
                                  key={c}
                                  className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={groupPatterns.includes(c)}
                                    onChange={() => toggleGroupCampaign(c)}
                                    className="rounded border-gray-300 text-slate-900 focus:ring-slate-500"
                                  />
                                  <span className="text-sm text-gray-700 truncate">{c}</span>
                                </label>
                              ))
                            )}
                          </div>
                        </>
                      )
                    })()}
                  </>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-gray-600">{t('settings.note')}</label>
                <textarea
                  value={groupNote}
                  onChange={(e) => setGroupNote(e.target.value)}
                  rows={2}
                  placeholder={t('settings.notePlaceholder')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSaveGroup}
                  disabled={groupSaving}
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-sm hover:shadow-indigo-500/15 disabled:opacity-50"
                >
                  {groupSaving ? t('settings.saving') : editingGroupId ? t('settings.updateGroup') : t('settings.createGroup')}
                </button>
                <button
                  type="button"
                  onClick={closeGroupEditor}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 5: Danger Zone ───────────────────── */}
      <section className="rounded-xl border border-red-200 bg-white shadow-sm">
        <div className="border-b border-red-100 px-4 sm:px-6 py-4">
          <h2 className="text-lg font-semibold text-red-600">{t('settings.dangerZone')}</h2>
        </div>
        <div className="px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('settings.deleteProject')}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('settings.deleteProjectDescription')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmText('')
                setShowDeleteModal(true)
              }}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-all duration-150 hover:bg-red-50"
            >
              {t('settings.deleteButton')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Delete Confirmation Modal ────────────────── */}
      {showDeleteModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
            deleteModalVisible ? 'bg-black/40' : 'bg-black/0'
          }`}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className={`w-full max-w-md mx-4 rounded-2xl bg-white p-5 sm:p-6 shadow-xl transition-all duration-200 ${
              deleteModalVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">{t('settings.deleteButton')}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {t('settings.deleteModalWarning')}
            </p>
            <div className="mt-4">
              <label className="block text-sm text-gray-700">
                {t('settings.typeToConfirm')} <span className="font-mono font-semibold">{project.name}</span>
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={project.name}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleteConfirmText !== project.name || deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? t('settings.deleting') : t('settings.deleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
