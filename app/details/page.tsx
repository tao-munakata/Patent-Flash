'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePatentStore } from '@/lib/store'
import PatentCard from '@/components/PatentCard'

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-700 p-5 animate-pulse">
      <div className="h-3 bg-gray-700 rounded w-1/3 mb-2" />
      <div className="h-5 bg-gray-700 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-700 rounded w-full mb-2" />
      <div className="h-3 bg-gray-700 rounded w-5/6" />
    </div>
  )
}

export default function DetailsPage() {
  const router = useRouter()
  const { searchResult, summaries, originalIdea, setSummaries } = usePatentStore()

  useEffect(() => {
    if (searchResult.patents.length === 0 || summaries.length > 0) return

    fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patents: searchResult.patents, originalIdea }),
    })
      .then((r) => r.json())
      .then((data) => setSummaries(data.summaries ?? []))
  }, [searchResult.patents, originalIdea, setSummaries, summaries.length])

  const loading = summaries.length === 0 && searchResult.patents.length > 0

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-10 max-w-2xl mx-auto">
      <div className="w-full flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/results')}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← 絞り込みに戻る
        </button>
        <h1 className="text-lg font-bold text-white">特許詳細</h1>
        <span className="text-xs text-gray-500">{searchResult.total} 件</span>
      </div>

      <div className="w-full flex flex-col gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : summaries.map((patent) => <PatentCard key={patent.id} patent={patent} />)}
      </div>

      {!loading && summaries.length === 0 && (
        <p className="text-gray-500 text-sm mt-8">
          特許データがありません。
          <button onClick={() => router.push('/results')} className="text-sky-400 ml-1">
            絞り込みに戻る
          </button>
        </p>
      )}
    </main>
  )
}
