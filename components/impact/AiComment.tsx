'use client'

interface AiCommentProps {
  comment: string | null
  isLoading?: boolean
}

export default function AiComment({
  comment,
  isLoading = false,
}: AiCommentProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <span className="text-sm font-medium text-slate-500">
            AI分析コメント
          </span>
        </div>
      </div>
      <div className="px-5 py-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-slate-200" />
          </div>
        ) : comment ? (
          <p className="text-sm leading-relaxed text-slate-700">{comment}</p>
        ) : (
          <p className="text-sm text-slate-400">
            AI分析を生成するには「分析を実行」ボタンを押してください
          </p>
        )}
        <p className="mt-3 text-xs italic text-slate-400">
          ※
          AIの分析は参考情報です。変化の因果関係を保証するものではありません。
        </p>
      </div>
    </div>
  )
}
