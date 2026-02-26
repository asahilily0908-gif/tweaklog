'use client'

import CommandPalette from './CommandPalette'
import { useCommandPalette } from './useCommandPalette'

interface CommandPaletteProviderProps {
  projectId: string
}

export default function CommandPaletteProvider({
  projectId,
}: CommandPaletteProviderProps) {
  const { isOpen, close } = useCommandPalette()

  return isOpen ? (
    <CommandPalette isOpen={isOpen} onClose={close} projectId={projectId} />
  ) : null
}
