import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import AcceptInvitation from './AcceptInvitation'

export const metadata = {
  title: 'Join Team | Tweaklog',
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  // Fetch invitation details using admin client
  const { data: invitation } = await admin
    .from('team_invitations')
    .select('id, org_id, email, role, status, expires_at, invited_by')
    .eq('token', token)
    .single()

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-sm rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Invalid invitation</h1>
          <p className="mt-2 text-sm text-gray-500">This invitation link is invalid or has been revoked.</p>
        </div>
      </div>
    )
  }

  // Get org name and inviter info
  const [orgResult, inviterResult] = await Promise.all([
    admin.from('organizations').select('name').eq('id', invitation.org_id).single(),
    admin.from('profiles').select('email, display_name').eq('id', invitation.invited_by).single(),
  ])

  // Check current user session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isExpired = invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()

  return (
    <AcceptInvitation
      token={token}
      orgName={orgResult.data?.name ?? 'Unknown'}
      inviterEmail={inviterResult.data?.email ?? ''}
      role={invitation.role}
      expiresAt={invitation.expires_at}
      isExpired={isExpired}
      isAccepted={invitation.status === 'accepted'}
      isLoggedIn={!!user}
    />
  )
}
