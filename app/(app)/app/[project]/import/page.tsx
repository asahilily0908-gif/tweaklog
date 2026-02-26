import ImportFlow from '@/components/import/ImportFlow'

export const metadata = {
  title: 'Import Data | Tweaklog',
}

export default function ImportPage() {
  return (
    <div className="animate-fade-in-up">
      <ImportFlow />
    </div>
  )
}
