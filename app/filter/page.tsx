'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePatentStore } from '@/lib/store'
import IndustryFilter from '@/components/IndustryFilter'

export default function FilterPage() {
  const router = useRouter()
  const { industryTags, setIndustryTags, selectedKeywords, setSearchResult } = usePatentStore()
  const [tags, setTags] = useState<string[]>(industryTags)
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    setLoading(true)
    try {
      setIndustryTags(tags)
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: selectedKeywords, industryTags: tags }),
      })
      const data = await res.json()
      setSearchResult(data)
      router.push('/results')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">業界フィルタ</h1>
      <p className="text-gray-400 text-sm mb-8">
        関連する業界を選んで絞り込んでください（複数選択可）
      </p>

      <div className="w-full mb-10">
        <IndustryFilter selected={tags} onChange={setTags} />
      </div>

      <button
        onClick={handleApply}
        disabled={tags.length === 0 || loading}
        className="w-full max-w-xs h-12 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white font-semibold transition-colors"
      >
        {loading ? '検索中...' : 'この業界で絞り込む'}
      </button>
      <button
        onClick={() => router.back()}
        className="mt-4 text-xs text-gray-600 hover:text-gray-400 transition-colors"
      >
        ← 戻る
      </button>
    </main>
  )
}
