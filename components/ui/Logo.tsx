export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-base', md: 'w-9 h-9 text-base', lg: 'w-10 h-10 text-xl' }
  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm`}>
      <span className="text-white font-semibold">T</span>
    </div>
  )
}
