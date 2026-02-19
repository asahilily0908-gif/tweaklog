import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CsvImportContent from '@/components/import/CsvImportContent'

export const metadata = {
  title: 'Import CSV | Tweaklog',
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

  return (
    <div className="animate-fade-in-up">
      <CsvImportContent project={project} />
    </div>
  )
}
