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
import NewChangeForm from '@/components/experiments/NewChangeForm'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

interface Command {
  id: string
  icon: typeof Search
  label: string
  description: string
  shortcut?: string
  section: string
}

const COMMANDS: Command[] = [
  {
    id: 'new-change',
    icon: PlusCircle,
    label: '変更を記録',
    description: '新しい広告変更を記録する',
    shortcut: 'N',
    section: 'アクション',
  },
  {
    id: 'search-changes',
    icon: Search,
    label: '変更を検索',
    description: '過去の変更履歴を検索する',
    shortcut: 'S',
    section: 'アクション',
  },
  {
    id: 'import-csv',
    icon: Upload,
    label: 'CSVインポート',
    description: 'CSVファイルから変更履歴を取り込む',
    section: 'アクション',
  },
  {
    id: 'go-dashboard',
    icon: BarChart3,
    label: 'ダッシュボード',
    description: 'KPIダッシュボードを表示',
    shortcut: 'D',
    section: 'ナビゲーション',
  },
  {
    id: 'go-experiments',
    icon: ClipboardList,
    label: '変更履歴',
    description: 'すべての変更一覧を表示',
    shortcut: 'E',
    section: 'ナビゲーション',
  },
  {
    id: 'go-ai-chat',
    icon: MessageSquare,
    label: 'AI分析チャット',
    description: 'AIと対話して分析する',
    shortcut: 'A',
    section: 'ナビゲーション',
  },
  {
    id: 'go-settings',
    icon: Settings,
    label: '設定',
    description: 'プロジェクト設定を開く',
    section: 'ナビゲーション',
  },
  {
    id: 'go-import',
    icon: FileUp,
    label: 'データインポート',
    description: 'CSVインポート画面を開く',
    section: 'ナビゲーション',
  },
]

function isNaturalLanguageInput(text: string): boolean {
  return (
    /入札|クリエイティブ|ターゲティング|予算/.test(text) ||
    /→|から|に変更/.test(text) ||
    /\d+\s*円/.test(text)
  )
}

export default function CommandPalette({
  isOpen,
  onClose,
  projectId,
}: CommandPaletteProps) {
  const router = useRouter()
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
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q)
    )
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
    const list = sections.get(cmd.section) ?? []
    list.push(cmd)
    sections.set(cmd.section, list)
  }

  const handleCommand = useCallback(
    (commandId: string) => {
      onClose()
      switch (commandId) {
        case 'new-change':
          // Reopen as form
          setTimeout(() => setShowNewChangeForm(true), 100)
          return // Don't close yet
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

  // Show NewChangeForm modal
  if (showNewChangeForm) {
    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setShowNewChangeForm(false)
            onClose()
          }}
        />
        {/* Form */}
        <div className="fixed left-1/2 top-[10%] z-50 w-full max-w-lg -translate-x-1/2 rounded-2xl bg-white p-6 shadow-2xl">
          <NewChangeForm
            onClose={() => {
              setShowNewChangeForm(false)
              onClose()
            }}
            prefillText={naturalLanguageText || undefined}
            projectId={projectId}
          />
        </div>
      </>
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
            placeholder="コマンドを入力、または変更を自然言語で記録..."
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
                  この内容を変更として記録する
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
                    <span className="text-sm font-medium">{cmd.label}</span>
                    <span className="flex-1 text-right text-xs text-slate-400">
                      {cmd.description}
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
              コマンドが見つかりません
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
