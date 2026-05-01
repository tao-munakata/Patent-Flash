export interface Keyword {
  word: string
  category: 'action' | 'purpose' | 'means'
  weight: number // 想定ヒット件数
}

export interface Patent {
  id: string
  title: string
  abstract: string
  assignee: string
  inventor: string
  date: string
  url?: string
}

export interface PatentSummary extends Patent {
  summary: string
  similarityScore: number // 0.0 ~ 1.0
  avoidanceHint: string
}

export interface SearchResult {
  total: number
  patents: Patent[]
}
