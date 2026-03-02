import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserPlan } from '@/lib/stripe/check-plan'
import { PLAN_LIMITS, type PlanType } from '@/lib/plan-config'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orgId, email, role } = await request.json()

  if (!orgId || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['operator', 'manager', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Check plan
  const plan = await getUserPlan(user.id)
  if (!['team', 'enterprise'].includes(plan)) {
    return NextResponse.json({ error: 'Team features require the Team plan' }, { status: 403 })
  }

  // Check caller is owner/manager of this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'manager'].includes(membership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Check member count
  const { count } = await admin
    .from('org_members')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const maxMembers = PLAN_LIMITS[plan as PlanType]?.maxTeamMembers ?? 1
  if ((count ?? 0) >= maxMembers) {
    return NextResponse.json({ error: `Member limit reached (max ${maxMembers})` }, { status: 400 })
  }

  // Check if email is already a member
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existingProfile) {
    const { data: existingMember } = await admin
      .from('org_members')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', existingProfile.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'This user is already a member' }, { status: 400 })
    }
  }

  // Check for existing pending invitation
  const { data: existingInvite } = await admin
    .from('team_invitations')
    .select('id')
    .eq('org_id', orgId)
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .single()

  if (existingInvite) {
    return NextResponse.json({ error: 'An invitation has already been sent to this email' }, { status: 400 })
  }

  // Create invitation
  const { data: invitation, error: insertError } = await supabase
    .from('team_invitations')
    .insert({
      org_id: orgId,
      invited_by: user.id,
      email: email.toLowerCase(),
      role,
    })
    .select('id, token')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const origin = request.headers.get('origin') || 'https://tweaklog.vercel.app'
  const inviteUrl = `${origin}/invite/${invitation.token}`

  return NextResponse.json({
    success: true,
    inviteUrl,
    token: invitation.token,
  })
}
