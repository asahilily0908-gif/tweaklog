'use client'

import { ArrowRight } from 'lucide-react'

interface DiffDisplayProps {
  before?: string
  after?: string
}

export default function DiffDisplay({ before, after }: DiffDisplayProps) {
  if (!before && !after) return null

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      {before && <span className="text-slate-500 line-through">{before}</span>}
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
      {after && <span className="font-medium text-slate-900">{after}</span>}
    </span>
  )
}
