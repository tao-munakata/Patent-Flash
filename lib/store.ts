import { create } from 'zustand'
import type { Keyword, Patent, PatentSummary, SearchResult } from '@/types'

interface PatentStore {
  originalIdea: string
  keywords: Keyword[]
  selectedKeywords: string[]
  industryTags: string[]
  searchResult: SearchResult
  summaries: PatentSummary[]
  setOriginalIdea: (idea: string) => void
  setKeywords: (kw: Keyword[]) => void
  addSelectedKeyword: (word: string) => void
  removeSelectedKeyword: (word: string) => void
  setIndustryTags: (tags: string[]) => void
  setSearchResult: (result: SearchResult) => void
  setSummaries: (summaries: PatentSummary[]) => void
  reset: () => void
}

const initialSearchResult: SearchResult = { total: 0, patents: [] }

export const usePatentStore = create<PatentStore>((set) => ({
  originalIdea: '',
  keywords: [],
  selectedKeywords: [],
  industryTags: [],
  searchResult: initialSearchResult,
  summaries: [],

  setOriginalIdea: (idea) => set({ originalIdea: idea }),
  setKeywords: (keywords) => set({ keywords }),
  addSelectedKeyword: (word) =>
    set((state) => ({
      selectedKeywords: state.selectedKeywords.includes(word)
        ? state.selectedKeywords
        : [...state.selectedKeywords, word],
    })),
  removeSelectedKeyword: (word) =>
    set((state) => ({
      selectedKeywords: state.selectedKeywords.filter((w) => w !== word),
    })),
  setIndustryTags: (tags) => set({ industryTags: tags }),
  setSearchResult: (result) => set({ searchResult: result }),
  setSummaries: (summaries) => set({ summaries }),
  reset: () =>
    set({
      originalIdea: '',
      keywords: [],
      selectedKeywords: [],
      industryTags: [],
      searchResult: initialSearchResult,
      summaries: [],
    }),
}))
