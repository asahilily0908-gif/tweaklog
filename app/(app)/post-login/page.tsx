import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PostLoginPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has any existing projects via org_members → projects
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (membership) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('org_id', membership.org_id)
      .limit(1)
      .single()

    if (project) {
      redirect(`/app/${project.id}/dashboard`)
    }
  }

  // No projects found — send to setup
  redirect('/setup')
}
