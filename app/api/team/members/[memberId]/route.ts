import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role } = await request.json()
  if (!['operator', 'manager', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get the target member
  const { data: target } = await admin
    .from('org_members')
    .select('id, org_id, user_id, role')
    .eq('id', memberId)
    .single()

  if (!target) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Can't change owner role
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'Cannot change the owner\'s role' }, { status: 400 })
  }

  // Can't change own role
  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  // Check caller is owner/manager
  const { data: callerMembership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', target.org_id)
    .eq('user_id', user.id)
    .single()

  if (!callerMembership || !['owner', 'manager'].includes(callerMembership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Update role
  const { error } = await supabase
    .from('org_members')
    .update({ role })
    .eq('id', memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Get the target member
  const { data: target } = await admin
    .from('org_members')
    .select('id, org_id, user_id, role')
    .eq('id', memberId)
    .single()

  if (!target) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Can't remove owner
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 400 })
  }

  // Can't remove self
  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }

  // Check caller is owner/manager
  const { data: callerMembership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', target.org_id)
    .eq('user_id', user.id)
    .single()

  if (!callerMembership || !['owner', 'manager'].includes(callerMembership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Delete member
  const { error } = await supabase
    .from('org_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
