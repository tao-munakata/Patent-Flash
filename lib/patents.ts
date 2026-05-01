import type { Patent, SearchResult } from '@/types'

const MOCK_PATENTS: Patent[] = [
  {
    id: 'JP2023-189451',
    title: '音響信号処理装置および音響信号処理方法',
    abstract: '入力手段から取得した音響信号をFFT処理により周波数領域に変換し、特定の周波数成分を抽出する技術に関する。',
    assignee: '株式会社音響技研',
    inventor: '田中太郎',
    date: '2023-12-01',
    url: 'https://patents.google.com/patent/JP2023189451',
  },
  {
    id: 'JP2022-234567',
    title: '信号抽出装置',
    abstract: '複数の入力手段から取得した信号を増幅し、フィルタリング処理により目的の成分を抽出する装置。',
    assignee: '電子工業株式会社',
    inventor: '鈴木一郎',
    date: '2022-08-15',
  },
  {
    id: 'JP2024-012345',
    title: 'データ処理システムおよびその制御方法',
    abstract: '入力手段から受信したデータをリアルタイムで処理し、目的に応じた出力を生成するシステム。',
    assignee: 'デジタルテクノロジー株式会社',
    inventor: '佐藤花子',
    date: '2024-02-20',
  },
  {
    id: 'JP2023-098765',
    title: 'センサデータ解析装置',
    abstract: 'センサから取得したデータをAIモデルで解析し、異常検知を行うシステムに関する。',
    assignee: 'AI技術研究所',
    inventor: '山田次郎',
    date: '2023-07-10',
  },
  {
    id: 'JP2021-456789',
    title: '信号変換方法および信号変換装置',
    abstract: 'アナログ信号をデジタル信号に変換し、高速フーリエ変換を用いて周波数分析を行う方法。',
    assignee: '信号処理株式会社',
    inventor: '伊藤三郎',
    date: '2021-11-30',
  },
]

export async function searchPatents(
  keywords: string[],
  industryTags: string[] = []
): Promise<SearchResult> {
  const apiKey = process.env.SERPAPI_KEY

  if (!apiKey) {
    // モックデータを返す（キーワード数に応じて件数を減らす）
    const total = Math.max(
      5,
      Math.floor(1200 / (keywords.length + 1)) - industryTags.length * 80
    )
    const patents = MOCK_PATENTS.slice(0, Math.min(total, MOCK_PATENTS.length))
    return { total, patents }
  }

  // SerpAPI Google Patents
  const query = [
    ...keywords,
    ...industryTags.map((t) => `"${t}"`),
  ].join(' AND ')

  const url = new URL('https://serpapi.com/search.json')
  url.searchParams.set('engine', 'google_patents')
  url.searchParams.set('q', query)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('country', 'JP')
  url.searchParams.set('num', '10')

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`SerpAPI error: ${res.status}`)
  }

  const data = await res.json()
  const results = data.organic_results ?? []

  const patents: Patent[] = results.map((r: Record<string, string>) => ({
    id: r.patent_id ?? r.publication_number ?? 'unknown',
    title: r.title ?? '',
    abstract: r.snippet ?? '',
    assignee: r.assignee ?? '',
    inventor: r.inventor ?? '',
    date: r.priority_date ?? r.filing_date ?? '',
    url: r.pdf ?? r.serpapi_link,
  }))

  return {
    total: data.search_information?.total_results ?? patents.length,
    patents,
  }
}
