import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { getUserPlan } from '@/lib/stripe/check-plan'
import { PlanProvider } from '@/lib/plan-context'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ project: string }>
}) {
  const { project: projectId } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single()

  if (!project) {
    notFound()
  }

  const { data: { user } } = await supabase.auth.getUser()
  const plan = user ? await getUserPlan(user.id) : 'free'

  return (
    <PlanProvider plan={plan}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar projectId={project.id} projectName={project.name} userEmail={user?.email ?? null} userId={user?.id} />
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          {children}
        </main>
      </div>
    </PlanProvider>
  )
}
