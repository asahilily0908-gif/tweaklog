import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ImportTabs from '@/components/import/ImportTabs'

export const metadata = {
  title: 'Import Data | Tweaklog',
}

export default async function ImportPage({
  params,
}: {
  params: Promise<{ project: string }>
}) {
  const { project: projectId } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, platform, settings')
    .eq('id', projectId)
    .single()

  if (!project) {
    notFound()
  }

  // Fetch existing spreadsheet configs (multiple per project)
  const { data: spreadsheetConfigs } = await supabase
    .from('spreadsheet_configs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  return (
    <div className="animate-fade-in-up">
      <ImportTabs project={project} spreadsheetConfigs={spreadsheetConfigs ?? []} />
    </div>
  )
}
