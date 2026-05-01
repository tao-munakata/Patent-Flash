'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePatentStore } from '@/lib/store'
import SpeechInput from '@/components/SpeechInput'

export default function Home() {
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const { setOriginalIdea, setKeywords, reset } = usePatentStore()
  const router = useRouter()

  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!idea.trim()) return
    reset()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: idea }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      if (!data.keywords?.length) throw new Error('キーワードが取得できませんでした')
      setOriginalIdea(idea)
      setKeywords(data.keywords)
      router.push('/results')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col min-h-screen items-center justify-center px-6 py-16">
      <h1 className="text-4xl font-bold mb-2 text-sky-400">特許フラッシュ ⚡</h1>
      <p className="text-gray-400 mb-10 text-sm">アイデアを入力してAIでキーワードを抽出</p>

      <div className="w-full max-w-xl">
        <textarea
          className="w-full h-40 rounded-xl bg-gray-900 border border-gray-700 text-white p-4 text-sm resize-none focus:outline-none focus:border-sky-500 transition-colors"
          placeholder="ここにアイデアを入力..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze()
          }}
        />
        {error && (
          <p className="mt-2 text-sm text-red-400 rounded-lg bg-red-950/50 px-3 py-2">
            エラー: {error}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <SpeechInput onResult={(text) => setIdea((prev) => prev + text)} />
          <button
            onClick={handleAnalyze}
            disabled={!idea.trim() || loading}
            className="flex-1 h-12 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white font-semibold transition-colors"
          >
            {loading ? '解析中...' : '解析する'}
          </button>
        </div>
      </div>

      <div className="mt-10 flex gap-5 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
          作用/動作
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          目的
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
          手段
        </span>
      </div>
    </main>
  )
}
