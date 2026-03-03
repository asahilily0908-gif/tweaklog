'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  PlusCircle,
  Upload,
  BarChart3,
  ClipboardList,
  MessageSquare,
  Settings,
  FileUp,
  Zap,
} from 'lucide-react'
import NewChangeModal from '@/components/experiments/NewChangeModal'
import { useTranslation } from '@/lib/i18n/config'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

interface Command {
  id: string
  icon: typeof Search
  labelKey: string
  descKey: string
  shortcut?: string
  sectionKey: string
}

const COMMANDS: Command[] = [
  {
    id: 'new-change',
    icon: PlusCircle,
    labelKey: 'commandPalette.commands.newChange',
    descKey: 'commandPalette.commands.newChangeDesc',
    shortcut: 'N',
    sectionKey: 'commandPalette.sections.actions',
  },
  {
    id: 'search-changes',
    icon: Search,
    labelKey: 'commandPalette.commands.searchChanges',
    descKey: 'commandPalette.commands.searchChangesDesc',
    shortcut: 'S',
    sectionKey: 'commandPalette.sections.actions',
  },
  {
    id: 'import-csv',
    icon: Upload,
    labelKey: 'commandPalette.commands.importCsv',
    descKey: 'commandPalette.commands.importCsvDesc',
    sectionKey: 'commandPalette.sections.actions',
  },
  {
    id: 'go-dashboard',
    icon: BarChart3,
    labelKey: 'commandPalette.commands.dashboard',
    descKey: 'commandPalette.commands.dashboardDesc',
    shortcut: 'D',
    sectionKey: 'commandPalette.sections.navigation',
  },
  {
    id: 'go-experiments',
    icon: ClipboardList,
    labelKey: 'commandPalette.commands.experiments',
    descKey: 'commandPalette.commands.experimentsDesc',
    shortcut: 'E',
    sectionKey: 'commandPalette.sections.navigation',
  },
  {
    id: 'go-ai-chat',
    icon: MessageSquare,
    labelKey: 'commandPalette.commands.aiChat',
    descKey: 'commandPalette.commands.aiChatDesc',
    shortcut: 'A',
    sectionKey: 'commandPalette.sections.navigation',
  },
  {
    id: 'go-settings',
    icon: Settings,
    labelKey: 'commandPalette.commands.settings',
    descKey: 'commandPalette.commands.settingsDesc',
    sectionKey: 'commandPalette.sections.navigation',
  },
  {
    id: 'go-import',
    icon: FileUp,
    labelKey: 'commandPalette.commands.dataImport',
    descKey: 'commandPalette.commands.dataImportDesc',
    sectionKey: 'commandPalette.sections.navigation',
  },
]

function isNaturalLanguageInput(text: string): boolean {
  return (
    /入札|クリエイティブ|ターゲティング|予算/.test(text) ||
    /bid|creative|targeting|budget/i.test(text) ||
    /→|から|に変更/.test(text) ||
    /\d+\s*円/.test(text) ||
    /\$\d+/.test(text)
  )
}

export default function CommandPalette({
  isOpen,
  onClose,
  projectId,
}: CommandPaletteProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showNewChangeForm, setShowNewChangeForm] = useState(false)
  const [naturalLanguageText, setNaturalLanguageText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on open
  useEffect(() => {
    if (isOpen && !showNewChangeForm) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, showNewChangeForm])

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setShowNewChangeForm(false)
    }
  }, [isOpen])

  const hasNaturalLanguage = query.length > 0 && isNaturalLanguageInput(query)

  const filteredCommands = COMMANDS.filter((cmd) => {
    if (!query) return true
    const q = query.toLowerCase()
    const label = t(cmd.labelKey).toLowerCase()
    const desc = t(cmd.descKey).toLowerCase()
    return label.includes(q) || desc.includes(q)
  })

  // Build display items: natural language suggestion + filtered commands
  const allItems: Array<
    | { type: 'natural'; text: string }
    | { type: 'command'; command: Command }
  > = []

  if (hasNaturalLanguage) {
    allItems.push({ type: 'natural', text: query })
  }

  for (const cmd of filteredCommands) {
    allItems.push({ type: 'command', command: cmd })
  }

  // Group commands by section for display
  const sections = new Map<string, Command[]>()
  for (const cmd of filteredCommands) {
    const sectionLabel = t(cmd.sectionKey)
    const list = sections.get(sectionLabel) ?? []
    list.push(cmd)
    sections.set(sectionLabel, list)
  }

  const handleCommand = useCallback(
    (commandId: string) => {
      switch (commandId) {
        case 'new-change':
          setShowNewChangeForm(true)
          return
        case 'search-changes':
          router.push(`/app/${projectId}/experiments`)
          break
        case 'import-csv':
          router.push(`/app/${projectId}/import`)
          break
        case 'go-dashboard':
          router.push(`/app/${projectId}/dashboard`)
          break
        case 'go-experiments':
          router.push(`/app/${projectId}/experiments`)
          break
        case 'go-ai-chat':
          router.push(`/app/${projectId}/chat`)
          break
        case 'go-settings':
          router.push(`/app/${projectId}/settings`)
          break
        case 'go-import':
          router.push(`/app/${projectId}/import`)
          break
      }
      setTimeout(() => onClose(), 100)
    },
    [onClose, router, projectId]
  )

  const handleSelectItem = useCallback(
    (index: number) => {
      const item = allItems[index]
      if (!item) return

      if (item.type === 'natural') {
        console.log('Natural language input:', item.text)
        setNaturalLanguageText(item.text)
        setShowNewChangeForm(true)
      } else {
        handleCommand(item.command.id)
      }
    },
    [allItems, handleCommand]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleSelectItem(selectedIndex)
      }
    },
    [allItems.length, selectedIndex, handleSelectItem]
  )

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isOpen && !showNewChangeForm) return null

  // Show NewChangeModal
  if (showNewChangeForm) {
    return (
      <NewChangeModal
        projectId={projectId}
        platforms={['google_ads', 'meta', 'tiktok', 'yahoo_ads']}
        onClose={() => { setShowNewChangeForm(false); onClose() }}
      />
    )
  }

  let flatIndex = 0

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        style={{ animation: 'fadeIn 150ms ease-out' }}
        onClick={onClose}
      />

      {/* Palette */}
      <div
        className="fixed left-1/2 top-[20%] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl box-border"
        style={{ animation: 'scaleIn 150ms ease-out' }}
      >
        {/* Search input */}
        <div className="flex w-full items-center gap-2 overflow-hidden border-b border-gray-200 px-3">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('commandPalette.placeholder')}
            className="min-w-0 flex-1 border-none shadow-none px-2 py-4 text-lg text-slate-900 placeholder-slate-400 outline-none focus:outline-none focus:ring-0"
          />
          <kbd className="shrink-0 whitespace-nowrap rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto py-2">
          {/* Natural language suggestion */}
          {hasNaturalLanguage && (
            <button
              type="button"
              className={`mx-2 flex w-[calc(100%-16px)] cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                selectedIndex === 0
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'hover:bg-slate-100'
              }`}
              onClick={() => handleSelectItem(flatIndex)}
              onMouseEnter={() => setSelectedIndex(flatIndex)}
            >
              <Zap
                className={`h-5 w-5 shrink-0 ${
                  selectedIndex === 0 ? 'text-indigo-500' : 'text-amber-500'
                }`}
              />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">
                  {t('commandPalette.naturalLanguageSuggestion')}
                </span>
                <p className="truncate text-xs text-slate-400">{query}</p>
              </div>
            </button>
          )}

          {/* Grouped commands */}
          {(() => {
            if (hasNaturalLanguage) flatIndex = 1
            else flatIndex = 0

            const elements: React.ReactNode[] = []

            for (const [section, commands] of sections) {
              elements.push(
                <div
                  key={section}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  {section}
                </div>
              )

              for (const cmd of commands) {
                const currentIdx = flatIndex
                const Icon = cmd.icon
                elements.push(
                  <button
                    key={cmd.id}
                    type="button"
                    className={`mx-2 flex w-[calc(100%-16px)] cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                      selectedIndex === currentIdx
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-slate-100'
                    }`}
                    onClick={() => handleSelectItem(currentIdx)}
                    onMouseEnter={() => setSelectedIndex(currentIdx)}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 ${
                        selectedIndex === currentIdx
                          ? 'text-indigo-500'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="text-sm font-medium">{t(cmd.labelKey)}</span>
                    <span className="flex-1 text-right text-xs text-slate-400">
                      {t(cmd.descKey)}
                    </span>
                    {cmd.shortcut && (
                      <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                )
                flatIndex++
              }
            }

            return elements
          })()}

          {/* Empty state */}
          {allItems.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              {t('commandPalette.noResults')}
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translateX(-50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }
      `}</style>
    </>
  )
}
