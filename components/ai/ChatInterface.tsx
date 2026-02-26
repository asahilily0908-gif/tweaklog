'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/config'
import { Sparkles, User } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatInterfaceProps {
  projectId: string
  initialMessages: Message[]
  chatId: string | null
}


function MessageBubble({
  role,
  content,
  isStreaming,
}: {
  role: string
  content: string
  isStreaming: boolean
}) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mr-2.5 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}
      {isUser && (
        <div className="order-1 ml-2.5 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}
      <div
        className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[#2563EB] text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        {content || (isStreaming && (
          <span className="inline-flex items-center gap-1.5 py-0.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
          </span>
        ))}
        {content && isStreaming && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-slate-400 align-text-bottom" />
        )}
      </div>
    </div>
  )
}

export default function ChatInterface({
  projectId,
  initialMessages,
  chatId: initialChatId,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [chatId] = useState<string | null>(initialChatId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { t } = useTranslation()
  const suggestions = [
    t('chat.suggestion1'),
    t('chat.suggestion2'),
    t('chat.suggestion3'),
    t('chat.suggestion4'),
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSend(text?: string) {
    const messageText = (text ?? input).trim()
    if (!messageText || isStreaming) return

    const userMessage: Message = { role: 'user', content: messageText }
    const newMessages = [...messages, userMessage]
    setMessages([...newMessages, { role: 'assistant', content: '' }])
    setInput('')
    setIsStreaming(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, chatId, messages: newMessages }),
      })

      if (!response.ok) {
        throw new Error('Chat request failed')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          updated[updated.length - 1] = { ...last, content: last.content + chunk }
          return updated
        })
      }
    } catch {
      // Remove the empty assistant placeholder on error
      setMessages((prev) => {
        const updated = [...prev]
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && !updated[updated.length - 1].content) {
          return updated.slice(0, -1)
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }

  const inputBar = (
    <div className="border-t border-gray-200 bg-white px-3 sm:px-6 py-3 sm:py-4">
      <div className="mx-auto flex max-w-2xl items-end gap-2 sm:gap-3">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={messages.length === 0 ? t('chat.placeholderFirst') : t('chat.placeholderFollowup')}
            rows={1}
            disabled={isStreaming}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all duration-150"
          />
        </div>
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim() || isStreaming}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          {isStreaming ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] text-gray-400">
        {t('chat.enterToSend')}
      </p>
    </div>
  )

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex h-full flex-col bg-white">
        {/* Header */}
        <div className="border-b border-gray-100 px-4 sm:px-6 py-4 sm:py-5">
          <h1 className="text-lg font-bold tracking-tight text-gray-900">{t('chat.title')}</h1>
          <p className="mt-0.5 text-xs text-gray-500">{t('chat.description')}</p>
        </div>

        {/* Empty state */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shadow-indigo-500/10">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-gray-900">{t('chat.emptyTitle')}</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
            {t('chat.emptyDescription')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all duration-150"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {inputBar}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-gray-900">{t('chat.emptyTitle')}</h1>
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-2 py-0.5 text-[10px] font-semibold text-white">Beta</span>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">
            {isStreaming ? t('chat.thinking') : t('chat.askAbout')}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="mx-auto max-w-2xl space-y-5">
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              role={msg.role}
              content={msg.content}
              isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {inputBar}
    </div>
  )
}
