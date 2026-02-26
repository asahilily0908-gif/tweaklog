import ImpactCard from '@/components/impact/ImpactCard'

const MOCK_EXPERIMENT = {
  id: 'mock-1',
  category: 'bid',
  platform: 'Google Ads',
  campaign: 'Brand Campaign',
  beforeValue: '¥120',
  afterValue: '¥150',
  reason: 'CVR上昇トレンドに合わせて入札を引き上げ',
  createdAt: '2026-02-20T10:30:00Z',
}

export const metadata = {
  title: 'Impact Card | Tweaklog',
}

export default async function ImpactCardPage({
  params,
}: {
  params: Promise<{ project: string; id: string }>
}) {
  const { project } = await params

  return (
    <div className="mx-auto max-w-4xl p-6">
      <ImpactCard experiment={MOCK_EXPERIMENT} projectId={project} />
    </div>
  )
}
