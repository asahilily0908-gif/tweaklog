import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記 | Tweaklog',
  description: '特定商取引法に基づく表記 — Tweaklog',
}

export default function CommercialTransactionsPage() {
  return (
    <div className="min-h-screen bg-[#0B1120]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors mb-8"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          ホームに戻る
        </Link>

        <h1 className="text-3xl font-bold text-white mb-12">特定商取引法に基づく表記</h1>

        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-800">
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  販売事業者
                </th>
                <td className="px-5 py-4 text-gray-300">
                  松島旭飛（Tweaklog運営事務局）
                </td>
              </tr>
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  代表者
                </th>
                <td className="px-5 py-4 text-gray-300">
                  松島旭飛
                </td>
              </tr>
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  所在地
                </th>
                <td className="px-5 py-4 text-gray-300">
                  東京都（詳細はお問い合わせください）
                </td>
              </tr>
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  メールアドレス
                </th>
                <td className="px-5 py-4 text-gray-300">
                  <a href="mailto:tweaklog41@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                    tweaklog41@gmail.com
                  </a>
                </td>
              </tr>
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  URL
                </th>
                <td className="px-5 py-4 text-gray-300">
                  <a href="https://tweaklog.vercel.app" className="text-blue-400 hover:text-blue-300 transition-colors">
                    https://tweaklog.vercel.app
                  </a>
                </td>
              </tr>
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  販売価格
                </th>
                <td className="px-5 py-4 text-gray-300">
                  <ul className="space-y-1">
                    <li>Free プラン: &#165;0</li>
                    <li>Pro プラン: &#165;3,980/月（税込）</li>
                    <li>Team プラン: &#165;9,800/月（税込）</li>
                    <li>Enterprise プラン: &#165;49,800/月（税込）</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  支払方法
                </th>
                <td className="px-5 py-4 text-gray-300">
                  クレジットカード（Stripe経由）
                </td>
              </tr>
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  支払時期
                </th>
                <td className="px-5 py-4 text-gray-300">
                  申込時に即時決済、以降毎月自動更新
                </td>
              </tr>
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  サービス提供時期
                </th>
                <td className="px-5 py-4 text-gray-300">
                  決済完了後、即時利用可能
                </td>
              </tr>
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  返品・キャンセル
                </th>
                <td className="px-5 py-4 text-gray-300">
                  デジタルサービスのため返品不可。サブスクリプションはいつでもキャンセル可能（現在の請求期間終了まで利用可能）。
                </td>
              </tr>
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  動作環境
                </th>
                <td className="px-5 py-4 text-gray-300">
                  モダンブラウザ（Chrome, Firefox, Safari, Edge の最新版）
                </td>
              </tr>
              <tr>
                <th className="bg-gray-900/50 px-5 py-4 text-left font-semibold text-gray-200 w-1/3 align-top">
                  特別条件
                </th>
                <td className="px-5 py-4 text-gray-300">
                  なし
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
