'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/config'
import { usePlan } from '@/lib/plan-context'
import { PLAN_LIMITS, type PlanType } from '@/lib/plan-config'

interface Member {
  id: string
  userId: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  role: string
  createdAt: string
}

interface PendingInvitation {
  id: string
  email: string
  role: string
  expiresAt: string
  createdAt: string
  invitedByEmail: string
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  operator: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
}

export default function TeamSection({
  orgId,
  currentUserId,
}: {
  orgId: string
  currentUserId: string
}) {
  const { t } = useTranslation()
  const { plan } = usePlan()
  const pathname = usePathname()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string>('viewer')
  const [loading, setLoading] = useState(true)

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'operator' | 'manager' | 'viewer'>('operator')
  const [inviting, setInviting] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  const isManager = ['owner', 'manager'].includes(currentUserRole)
  const maxMembers = PLAN_LIMITS[plan as PlanType]?.maxTeamMembers ?? 1
  const atLimit = members.length >= maxMembers

  // Extract projectId from pathname
  const segments = pathname.split('/')
  const projectIdx = segments.indexOf('app') + 1
  const projectId = segments[projectIdx] || ''

  useEffect(() => {
    if (plan !== 'free') fetchMembers()
    else setLoading(false)
  }, [orgId, plan])

  async function fetchMembers() {
    try {
      const res = await fetch(`/api/team/members?orgId=${orgId}`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members)
        setInvitations(data.pendingInvitations)
        setCurrentUserRole(data.currentUserRole)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteUrl(null)

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error)
      } else {
        toast.success(t('team.inviteModal.inviteSent'))
        setInviteUrl(data.inviteUrl)
        fetchMembers()
      }
    } catch {
      toast.error('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
      } else {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        )
      }
    } catch {
      toast.error('Failed to change role')
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm(t('team.memberList.removeConfirm'))) return

    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== memberId))
      }
    } catch {
      toast.error('Failed to remove member')
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    if (!confirm(t('team.revokeConfirm'))) return

    try {
      const res = await fetch(`/api/team/invite/${invitationId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success(t('team.invitationRevoked'))
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
      }
    } catch {
      toast.error('Failed to revoke invitation')
    }
  }

  function copyInviteLink(url: string) {
    navigator.clipboard.writeText(url)
    toast.success(t('team.inviteModal.linkCopied'))
  }

  function getInitials(email: string, name: string | null) {
    if (name) return name.charAt(0).toUpperCase()
    return email.charAt(0).toUpperCase()
  }

  function getDaysRemaining(expiresAt: string) {
    const now = new Date()
    const end = new Date(expiresAt)
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  // Free plan: show lock overlay with Team plan messaging
  if (plan === 'free') {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-[2px] opacity-40">
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('team.title')}</h2>
              <p className="mt-0.5 text-xs text-gray-500">{t('team.description')}</p>
            </div>
            <div className="px-4 sm:px-6 py-5">
              <div className="animate-pulse space-y-3">
                <div className="h-14 rounded-lg bg-gray-100" />
                <div className="h-14 rounded-lg bg-gray-100" />
              </div>
            </div>
          </section>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white/95 px-8 py-8 shadow-lg backdrop-blur-sm max-w-sm text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{t('upgrade.teamTitle')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('upgrade.teamDescription')}</p>
            </div>
            <Link
              href={`/app/${projectId}/settings`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              {t('upgrade.teamCta')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{t('team.title')}</h2>
            <p className="mt-0.5 text-xs text-gray-500">{t('team.description')}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-400 tabular-nums whitespace-nowrap">
              {t('team.memberCount').replace('{count}', String(members.length)).replace('{max}', String(maxMembers))}
            </span>
            {isManager && !atLimit && (
              <button
                type="button"
                onClick={() => {
                  setInviteEmail('')
                  setInviteRole('operator')
                  setInviteUrl(null)
                  setShowInviteModal(true)
                }}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-sm font-medium text-white transition-all duration-150 hover:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                {t('team.inviteMember')}
              </button>
            )}
            {isManager && atLimit && plan === 'pro' && (
              <Link
                href={`/app/${projectId}/settings`}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1.5 text-sm font-medium text-white transition-all duration-150 hover:shadow-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                {t('upgrade.memberLimitCta')}
              </Link>
            )}
          </div>
        </div>
        {/* Member limit banner for Pro users at limit */}
        {atLimit && plan === 'pro' && (
          <div className="mt-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 px-4 py-2.5">
            <p className="text-xs text-indigo-700">
              {t('upgrade.memberLimitReached').replace('{max}', String(maxMembers))}
            </p>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 py-5">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-14 rounded-lg bg-gray-100" />
            <div className="h-14 rounded-lg bg-gray-100" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Member list */}
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                        {getInitials(member.email, member.displayName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {member.displayName || member.email}
                        </span>
                        {member.userId === currentUserId && (
                          <span className="inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {t('team.memberList.you')}
                          </span>
                        )}
                      </div>
                      {member.displayName && (
                        <p className="text-xs text-gray-400 truncate">{member.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role badge or selector */}
                    {isManager && member.role !== 'owner' && member.userId !== currentUserId ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      >
                        <option value="manager">{t('team.roles.manager')}</option>
                        <option value="operator">{t('team.roles.operator')}</option>
                        <option value="viewer">{t('team.roles.viewer')}</option>
                      </select>
                    ) : (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[member.role] ?? ROLE_COLORS.viewer}`}>
                        {t(`team.roles.${member.role}` as 'team.roles.owner')}
                      </span>
                    )}

                    {/* Remove button */}
                    {isManager && member.role !== 'owner' && member.userId !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title={t('team.memberList.removeMember')}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pending invitations */}
            {invitations.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t('team.pendingInvitations')}
                  </span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-lg border border-dashed border-gray-200 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-sm text-gray-400">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm text-gray-600 truncate block">{inv.email}</span>
                          <span className="text-[10px] text-gray-400">
                            {t('team.invitationExpires').replace('{days}', String(getDaysRemaining(inv.expiresAt)))}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[inv.role] ?? ROLE_COLORS.viewer}`}>
                          {t(`team.roles.${inv.role}` as 'team.roles.owner')}
                        </span>
                        {isManager && (
                          <>
                            <button
                              type="button"
                              onClick={() => copyInviteLink(`${window.location.origin}/invite/${inv.id}`)}
                              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              title={t('team.inviteModal.copyLink')}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevokeInvitation(inv.id)}
                              className="rounded px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                            >
                              {t('team.revokeInvitation')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invitations.length === 0 && members.length <= 1 && (
              <p className="text-sm text-gray-400 text-center py-2">
                {t('team.noPendingInvitations')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="w-full max-w-md mx-4 rounded-2xl bg-white p-5 sm:p-6 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{t('team.inviteModal.title')}</h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {inviteUrl ? (
              // Success: show invite link
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                  <svg className="mx-auto h-8 w-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-green-800">{t('team.inviteModal.inviteSent')}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('team.inviteModal.copyLink')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteUrl}
                      readOnly
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono text-gray-600 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => copyInviteLink(inviteUrl)}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                    >
                      {t('team.inviteModal.copyLink')}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInviteUrl(null)
                    setInviteEmail('')
                  }}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {t('team.inviteMember')}
                </button>
              </div>
            ) : (
              // Form
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('team.inviteModal.emailLabel')}
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t('team.inviteModal.emailPlaceholder')}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('team.inviteModal.roleLabel')}
                  </label>
                  <div className="space-y-2">
                    {(['operator', 'manager', 'viewer'] as const).map((role) => (
                      <label
                        key={role}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          inviteRole === role
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={inviteRole === role}
                          onChange={() => setInviteRole(role)}
                          className="mt-0.5 text-slate-900 focus:ring-slate-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {t(`team.roles.${role}`)}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t(`team.roleDescriptions.${role}`)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    className="flex-1 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-slate-800 disabled:opacity-50"
                  >
                    {inviting ? t('team.inviteModal.inviting') : t('team.inviteModal.invite')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
