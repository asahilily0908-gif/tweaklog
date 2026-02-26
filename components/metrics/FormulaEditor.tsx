'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { parseFormula } from '@/lib/metrics/formula-parser'
import TemplateSelector from './TemplateSelector'
import VariableAutocomplete from './VariableAutocomplete'
import FormulaPreview from './FormulaPreview'

interface FormulaEditorProps {
  value: {
    name: string
    displayName: string
    formula: string
    improvementDirection: 'up' | 'down'
  }
  onChange: (value: FormulaEditorProps['value']) => void
  sampleData?: Array<{
    date: string
    variables: Record<string, number | null>
  }>
  availableVariables?: string[]
  onSave?: () => void
  onCancel?: () => void
}

const DEFAULT_VARIABLES = [
  'Impressions',
  'Clicks',
  'Cost',
  'Conversions',
  'Revenue',
]

const FUNCTIONS_REFERENCE = [
  { name: 'IF(条件, 真, 偽)', example: 'IF(Revenue > 0, Revenue / Cost, 0)' },
  { name: 'SUM(a, b, ...)', example: 'SUM(CV_A, CV_B)' },
  { name: 'AVG(a, b, ...)', example: 'AVG(CPA_Mon, CPA_Tue)' },
  { name: 'MIN(a, b)', example: 'MIN(CPA, 1000)' },
  { name: 'MAX(a, b)', example: 'MAX(ROAS, 0)' },
]

function getWordAtCursor(
  text: string,
  cursorPos: number
): { word: string; start: number; end: number } {
  let start = cursorPos
  let end = cursorPos

  while (start > 0 && /[a-zA-Z0-9_]/.test(text[start - 1])) {
    start--
  }
  while (end < text.length && /[a-zA-Z0-9_]/.test(text[end])) {
    end++
  }

  return { word: text.slice(start, end), start, end }
}

export default function FormulaEditor({
  value,
  onChange,
  sampleData,
  availableVariables,
  onSave,
  onCancel,
}: FormulaEditorProps) {
  const variables =
    availableVariables && availableVariables.length > 0
      ? availableVariables
      : DEFAULT_VARIABLES

  const [formulaError, setFormulaError] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showReference, setShowReference] = useState(false)
  const [autocompleteText, setAutocompleteText] = useState('')
  const [showAutocomplete, setShowAutocomplete] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced formula validation
  const validateFormula = useCallback((formula: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!formula.trim()) {
      setFormulaError(null)
      return
    }

    debounceRef.current = setTimeout(() => {
      try {
        parseFormula(formula)
        setFormulaError(null)
      } catch (e) {
        setFormulaError(e instanceof Error ? e.message : '数式にエラーがあります')
      }
    }, 500)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleFormulaChange(newFormula: string) {
    onChange({ ...value, formula: newFormula })
    validateFormula(newFormula)

    // Autocomplete trigger
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart
      const { word } = getWordAtCursor(newFormula, cursorPos)
      if (word.length >= 2) {
        setAutocompleteText(word)
        setShowAutocomplete(true)
      } else {
        setShowAutocomplete(false)
      }
    }
  }

  function handleAutocompleteSelect(variable: string) {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const { start, end } = getWordAtCursor(value.formula, cursorPos)
    const newFormula =
      value.formula.slice(0, start) + variable + value.formula.slice(end)

    onChange({ ...value, formula: newFormula })
    validateFormula(newFormula)
    setShowAutocomplete(false)

    // Restore focus and cursor position
    requestAnimationFrame(() => {
      textarea.focus()
      const newPos = start + variable.length
      textarea.setSelectionRange(newPos, newPos)
    })
  }

  function handleVariableChipClick(variable: string) {
    const textarea = textareaRef.current
    const cursorPos = textarea?.selectionStart ?? value.formula.length
    const before = value.formula.slice(0, cursorPos)
    const after = value.formula.slice(cursorPos)
    const needsSpace = before.length > 0 && !/[\s(+\-*/,]$/.test(before)
    const newFormula = before + (needsSpace ? ' ' : '') + variable + after
    onChange({ ...value, formula: newFormula })
    validateFormula(newFormula)

    requestAnimationFrame(() => {
      textarea?.focus()
      const newPos = cursorPos + variable.length + (needsSpace ? 1 : 0)
      textarea?.setSelectionRange(newPos, newPos)
    })
  }

  function handleTemplateSelect(template: {
    name: string
    displayName: string
    formula: string
    improvementDirection: 'up' | 'down'
  }) {
    onChange(template)
    validateFormula(template.formula)
  }

  const hasFormulaError = formulaError !== null
  const canSave =
    value.name.trim() !== '' &&
    value.displayName.trim() !== '' &&
    value.formula.trim() !== '' &&
    !hasFormulaError

  return (
    <div className="max-w-2xl space-y-6">
      {/* Metric name inputs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            指標ID
          </label>
          <input
            type="text"
            value={value.name}
            onChange={(e) =>
              onChange({
                ...value,
                name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
              })
            }
            placeholder="例: gross_profit_roas"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            表示名
          </label>
          <input
            type="text"
            value={value.displayName}
            onChange={(e) =>
              onChange({ ...value, displayName: e.target.value })
            }
            placeholder="例: 粗利ROAS"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Template selector (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-200 ${showTemplates ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
          テンプレートから始める
        </button>
        {showTemplates && (
          <div className="mt-3">
            <TemplateSelector onSelect={handleTemplateSelect} />
          </div>
        )}
      </div>

      {/* Formula input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          数式
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value.formula}
            onChange={(e) => handleFormulaChange(e.target.value)}
            onBlur={() =>
              setTimeout(() => setShowAutocomplete(false), 150)
            }
            rows={4}
            placeholder="例: (Revenue - COGS) / Cost"
            className={`block w-full rounded-xl p-4 font-mono text-sm min-h-[120px] focus:outline-none focus:ring-2 transition-colors ${
              hasFormulaError
                ? 'bg-slate-900 text-green-400 border-2 border-red-500 focus:ring-red-500'
                : 'bg-slate-900 text-green-400 border border-slate-700 focus:ring-indigo-500'
            }`}
          />
          <VariableAutocomplete
            variables={variables}
            onSelect={handleAutocompleteSelect}
            searchText={autocompleteText}
            isVisible={showAutocomplete}
          />
        </div>
        {hasFormulaError && (
          <p className="mt-1.5 text-sm text-red-500">{formulaError}</p>
        )}
      </div>

      {/* Reference panel (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowReference(!showReference)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${showReference ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
          利用可能な変数と関数
        </button>
        {showReference && (
          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            {/* Variables */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">変数</p>
              <div className="flex flex-wrap gap-1.5">
                {variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleVariableChipClick(v)}
                    className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-mono text-indigo-700 hover:bg-indigo-100 cursor-pointer transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Functions */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">関数</p>
              <div className="space-y-1">
                {FUNCTIONS_REFERENCE.map((f) => (
                  <div
                    key={f.name}
                    className="text-xs font-mono text-gray-600"
                  >
                    <span className="text-purple-600">{f.name}</span>
                    <span className="mx-2 text-gray-300">—</span>
                    <span className="text-gray-400">{f.example}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Improvement direction */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          改善方向
        </label>
        <div className="flex gap-4">
          <label
            className={`flex items-center gap-2 text-sm cursor-pointer transition-colors ${
              value.improvementDirection === 'up'
                ? 'text-green-600 font-medium'
                : 'text-gray-500'
            }`}
          >
            <input
              type="radio"
              name="improvementDirection"
              checked={value.improvementDirection === 'up'}
              onChange={() =>
                onChange({ ...value, improvementDirection: 'up' })
              }
              className="text-green-600 focus:ring-green-500"
            />
            ↑ 高いほど良い
          </label>
          <label
            className={`flex items-center gap-2 text-sm cursor-pointer transition-colors ${
              value.improvementDirection === 'down'
                ? 'text-red-600 font-medium'
                : 'text-gray-500'
            }`}
          >
            <input
              type="radio"
              name="improvementDirection"
              checked={value.improvementDirection === 'down'}
              onChange={() =>
                onChange({ ...value, improvementDirection: 'down' })
              }
              className="text-red-600 focus:ring-red-500"
            />
            ↓ 低いほど良い
          </label>
        </div>
      </div>

      {/* Preview */}
      <FormulaPreview formula={value.formula} sampleData={sampleData} />

      {/* Action buttons */}
      {(onSave || onCancel) && (
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              保存
            </button>
          )}
        </div>
      )}
    </div>
  )
}
