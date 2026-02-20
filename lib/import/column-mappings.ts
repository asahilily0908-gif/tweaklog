// Shared column name → standard field mappings for auto-detection
// Keys are lowercase for case-insensitive matching
export const COLUMN_GUESS_MAP: Record<string, string> = {
  // English
  'impressions': 'impressions', 'impr': 'impressions', 'impr.': 'impressions',
  'clicks': 'clicks', 'click': 'clicks',
  'ctr': 'ctr', 'click through rate': 'ctr',
  'cpc': 'cpc', 'avg. cpc': 'cpc', 'average cpc': 'cpc',
  'cost': 'cost', 'spend': 'cost', 'amount spent': 'cost',
  'conversions': 'conversions', 'conv': 'conversions', 'conv.': 'conversions',
  'cvr': 'cvr', 'conversion rate': 'cvr',
  'cpa': 'cpa', 'cost per conversion': 'cpa', 'cost/conv': 'cpa',
  'revenue': 'revenue', 'conv. value': 'revenue', 'conversion value': 'revenue', 'sales': 'revenue',
  'roas': 'roas',
  'date': 'date', 'day': 'date',
  'campaign': 'campaign', 'campaign name': 'campaign',
  'platform': 'platform',

  // Japanese (Google Ads)
  '表示回数': 'impressions', 'インプレッション': 'impressions',
  'クリック数': 'clicks', 'クリック': 'clicks',
  'クリック率': 'ctr',
  '平均クリック単価': 'cpc', 'クリック単価': 'cpc', '平均cpc': 'cpc',
  '費用': 'cost', 'コスト': 'cost', '利用金額': 'cost', '広告費': 'cost', '金額': 'cost',
  'コンバージョン': 'conversions', 'cv数': 'conversions', 'cv': 'conversions',
  'コンバージョン率': 'cvr',
  'コンバージョン単価': 'cpa', '獲得単価': 'cpa',
  '売上': 'revenue', '収益': 'revenue', 'コンバージョン値': 'revenue',
  '広告費用対効果': 'roas',
  '日付': 'date', '日': 'date',
  'キャンペーン': 'campaign', 'キャンペーン名': 'campaign',
  'プラットフォーム': 'platform', '媒体': 'platform',

  // Yahoo! Ads Japanese
  'インプレッション数': 'impressions',
  'クリック数（全て）': 'clicks',
  '合計費用': 'cost',
  'コンバージョン数': 'conversions',
}

export const STANDARD_FIELDS = [
  { key: 'date', label: 'Date', required: true },
  { key: 'platform', label: 'Platform', required: false },
  { key: 'campaign', label: 'Campaign', required: false },
  { key: 'impressions', label: 'Impressions', required: false },
  { key: 'clicks', label: 'Clicks', required: false },
  { key: 'cost', label: 'Cost', required: false },
  { key: 'conversions', label: 'Conversions', required: false },
  { key: 'revenue', label: 'Revenue', required: false },
  { key: 'ctr', label: 'CTR', required: false },
  { key: 'cpc', label: 'CPC', required: false },
  { key: 'cpa', label: 'CPA', required: false },
  { key: 'cvr', label: 'CVR', required: false },
  { key: 'roas', label: 'ROAS', required: false },
] as const

export function guessField(header: string): string {
  const lower = header.toLowerCase().trim()
  return COLUMN_GUESS_MAP[lower] ?? ''
}
