'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { DayPicker } from 'react-day-picker'
import { ja, enUS } from 'react-day-picker/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/config'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
}

function formatDate(date: Date, locale: string): string {
  if (locale === 'ja') {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}/${m}/${d}`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function toDate(value: string): Date | undefined {
  if (!value) return undefined
  return new Date(value + 'T00:00:00')
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const calendarClassNames = {
  root: 'p-3 relative',
  months: 'flex flex-col',
  month: 'space-y-3',
  month_caption: 'flex items-center justify-center relative h-8',
  caption_label: 'text-sm font-semibold text-gray-900',
  nav: 'absolute inset-x-1 top-3 flex items-center justify-between h-8 z-10',
  button_previous: 'inline-flex items-center justify-center h-7 w-7 rounded-lg bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer border-0',
  button_next: 'inline-flex items-center justify-center h-7 w-7 rounded-lg bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer border-0',
  chevron: 'h-4 w-4',
  weekdays: 'flex',
  weekday: 'w-9 text-center text-xs font-medium text-gray-400 py-1',
  week: 'flex mt-0.5',
  day: 'relative p-0 text-center',
  day_button: 'inline-flex items-center justify-center h-9 w-9 rounded-lg text-sm font-normal text-gray-700 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] transition-colors cursor-pointer border-0 bg-transparent',
  today: 'font-semibold text-[#7C3AED]',
  selected: 'bg-[#7C3AED] text-white hover:bg-[#7C3AED] hover:text-white rounded-lg',
  outside: 'text-gray-300',
  disabled: 'text-gray-200 cursor-not-allowed hover:bg-transparent',
  hidden: 'invisible',
}

export default function DatePicker({ value, onChange, required, disabled, className }: DatePickerProps) {
  const { locale, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = toDate(value)

  useEffect(() => {
    if (!isOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelect = useCallback((date: Date | undefined) => {
    if (date) {
      onChange(toYMD(date))
    } else {
      onChange('')
    }
    setIsOpen(false)
  }, [onChange])

  const handleToday = useCallback(() => {
    onChange(toYMD(new Date()))
    setIsOpen(false)
  }, [onChange])

  const handleClear = useCallback(() => {
    onChange('')
    setIsOpen(false)
  }, [onChange])

  const rdpLocale = locale === 'ja' ? ja : enUS
  const displayValue = selectedDate ? formatDate(selectedDate, locale) : ''

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-left transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || t('datePicker.placeholder')}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 rounded-xl border border-gray-200 bg-white shadow-lg animate-fade-in-up">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={rdpLocale}
            weekStartsOn={0}
            showOutsideDays
            classNames={calendarClassNames}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left'
                  ? <ChevronLeft className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />,
            }}
          />
          <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-medium text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
            >
              {t('datePicker.today')}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('datePicker.clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
