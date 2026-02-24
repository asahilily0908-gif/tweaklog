import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('orgId')

  if (!orgId) {
    return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })
  }

  // Verify caller is a member of this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  // Use admin client to read profiles (profiles RLS = own user only)
  const admin = createAdminClient()

  // Get org members
  const { data: members } = await admin
    .from('org_members')
    .select('id, user_id, role, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  // Get profiles for these members
  const userIds = (members ?? []).map((m) => m.user_id)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, display_name, avatar_url')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  )

  const enrichedMembers = (members ?? []).map((m) => {
    const profile = profileMap.get(m.user_id)
    return {
      id: m.id,
      userId: m.user_id,
      email: profile?.email ?? '',
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      role: m.role,
      createdAt: m.created_at,
    }
  })

  // Get pending invitations
  const { data: invitations } = await admin
    .from('team_invitations')
    .select('id, email, role, expires_at, created_at, invited_by')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Get inviter profiles
  const inviterIds = [...new Set((invitations ?? []).map((inv) => inv.invited_by))]
  const { data: inviterProfiles } = inviterIds.length > 0
    ? await admin.from('profiles').select('id, email').in('id', inviterIds)
    : { data: [] }
  const inviterMap = new Map(
    (inviterProfiles ?? []).map((p) => [p.id, p.email])
  )

  const enrichedInvitations = (invitations ?? []).map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    expiresAt: inv.expires_at,
    createdAt: inv.created_at,
    invitedByEmail: inviterMap.get(inv.invited_by) ?? '',
  }))

  return NextResponse.json({
    members: enrichedMembers,
    pendingInvitations: enrichedInvitations,
    currentUserRole: membership.role,
  })
}
