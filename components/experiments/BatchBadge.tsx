'use client'

import { Layers } from 'lucide-react'

interface BatchBadgeProps {
  count?: number
}

export default function BatchBadge({ count }: BatchBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-600"
      title="クリックして展開"
    >
      <Layers className="h-3 w-3" />
      {count} changes
    </span>
  )
}
