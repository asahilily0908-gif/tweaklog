'use client'

interface VariableAutocompleteProps {
  variables: string[]
  onSelect: (variable: string) => void
  searchText: string
  isVisible: boolean
}

export default function VariableAutocomplete({
  variables,
  onSelect,
  searchText,
  isVisible,
}: VariableAutocompleteProps) {
  if (!isVisible) return null

  const filtered = variables.filter((v) =>
    v.toLowerCase().includes(searchText.toLowerCase())
  )

  if (filtered.length === 0) return null

  return (
    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-md">
      {filtered.map((variable) => (
        <button
          key={variable}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(variable)
          }}
          className="block w-full rounded px-3 py-1.5 text-left text-sm font-mono text-gray-700 hover:bg-slate-100 cursor-pointer transition-colors"
        >
          {variable}
        </button>
      ))}
    </div>
  )
}
