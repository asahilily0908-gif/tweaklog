'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/config'

interface Props {
  token: string
  orgName: string
  inviterEmail: string
  role: string
  expiresAt: string
  isExpired: boolean
  isAccepted: boolean
  isLoggedIn: boolean
}

export default function AcceptInvitation({
  token,
  orgName,
  inviterEmail,
  role,
  expiresAt,
  isExpired,
  isAccepted,
  isLoggedIn,
}: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    operator: 'bg-green-100 text-green-700',
    viewer: 'bg-gray-100 text-gray-600',
  }

  async function handleAccept() {
    setAccepting(true)
    setError(null)

    const supabase = createClient()
    const { data, error: rpcError } = await supabase.rpc('accept_team_invitation', {
      invitation_token: token,
    })

    if (rpcError) {
      setError(rpcError.message)
      setAccepting(false)
      return
    }

    if (data?.error) {
      setError(data.error)
      setAccepting(false)
      return
    }

    setAccepted(true)

    // Find the first project in the org to redirect to
    const orgId = data?.org_id
    if (orgId) {
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('org_id', orgId)
        .limit(1)
        .single()

      if (projects) {
        setTimeout(() => router.push(`/app/${projects.id}/dashboard`), 1500)
        return
      }
    }

    setTimeout(() => router.push('/post-login'), 1500)
  }

  const expiresDate = new Date(expiresAt).toLocaleDateString()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm text-center">
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>

        {/* Expired/Accepted state */}
        {isExpired && !isAccepted && (
          <>
            <h1 className="text-lg font-semibold text-gray-900">{t('team.acceptInvitation.expired')}</h1>
            <p className="mt-2 text-sm text-gray-500">{orgName}</p>
          </>
        )}

        {isAccepted && !accepted && (
          <>
            <h1 className="text-lg font-semibold text-gray-900">{t('team.acceptInvitation.accepted')}</h1>
            <p className="mt-2 text-sm text-gray-500">{orgName}</p>
          </>
        )}

        {/* Success state */}
        {accepted && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">{t('team.acceptInvitation.accepted')}</h1>
          </>
        )}

        {/* Normal state: show invitation details */}
        {!isExpired && !isAccepted && !accepted && (
          <>
            <h1 className="text-lg font-semibold text-gray-900">{t('team.acceptInvitation.title')}</h1>
            <p className="mt-2 text-sm text-gray-500">
              {t('team.acceptInvitation.description').replace('{orgName}', orgName)}
            </p>

            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
                <span className="text-xs font-medium text-gray-500">{t('team.acceptInvitation.invitedBy')}</span>
                <span className="text-sm text-gray-900">{inviterEmail}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
                <span className="text-xs font-medium text-gray-500">{t('team.acceptInvitation.assignedRole')}</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[role] ?? ROLE_COLORS.viewer}`}>
                  {t(`team.roles.${role}` as 'team.roles.owner')}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
                <span className="text-xs font-medium text-gray-500">{t('team.acceptInvitation.expiresAt')}</span>
                <span className="text-sm text-gray-900">{expiresDate}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {accepting ? t('team.acceptInvitation.accepting') : t('team.acceptInvitation.accept')}
              </button>
            ) : (
              <div className="mt-6 space-y-3">
                <p className="text-xs text-gray-500">{t('team.acceptInvitation.loginRequired')}</p>
                <Link
                  href={`/login?redirect=/invite/${token}`}
                  className="block w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  {t('team.acceptInvitation.loginAndJoin')}
                </Link>
                <Link
                  href={`/signup?redirect=/invite/${token}`}
                  className="block w-full rounded-lg border border-gray-200 px-5 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('team.acceptInvitation.signupAndJoin')}
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
