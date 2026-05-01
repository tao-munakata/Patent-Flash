'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { usePatentStore } from '@/lib/store'
import WordCloud from '@/components/WordCloud'
import DraggableWord from '@/components/DraggableWord'
import DropZone from '@/components/DropZone'

export default function ResultsPage() {
  const router = useRouter()
  const {
    keywords,
    selectedKeywords,
    industryTags,
    searchResult,
    addSelectedKeyword,
    removeSelectedKeyword,
    setSearchResult,
  } = usePatentStore()

  const [loading, setLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const runSearch = async (selected: string[]) => {
    setLoading(true)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: selected, industryTags }),
      })
      if (!res.ok) return
      const data = await res.json()
      setSearchResult(data)
      if (data.total <= 10 && data.patents?.length > 0) {
        router.push('/details')
      }
    } finally {
      setLoading(false)
    }
  }

  // 初回マウント時に件数を取得（キーワードがない場合はそのまま表示）
  useEffect(() => {
    if (keywords.length === 0) return  // ホームに戻さない（ループ防止）
    runSearch(selectedKeywords)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over?.id === 'bucket') {
      const word = String(active.id)
      addSelectedKeyword(word)
      runSearch([...selectedKeywords, word])
    }
  }

  const handleWordClick = (word: string) => {
    addSelectedKeyword(word)
    runSearch([...selectedKeywords, word])
  }

  const handleRemove = (word: string) => {
    removeSelectedKeyword(word)
    runSearch(selectedKeywords.filter((w) => w !== word))
  }

  const total = searchResult.total
  const showFilterButton = total > 30 && selectedKeywords.length > 0

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main className="min-h-screen flex flex-col items-center px-6 py-10 max-w-3xl mx-auto">
        {/* カウンター */}
        <div className="w-full mb-6 text-center">
          <p className="text-xs text-gray-500 mb-1">絞り込み件数</p>
          <p
            className={`text-6xl font-black transition-opacity ${
              loading ? 'opacity-30' : 'opacity-100'
            } ${
              total <= 10
                ? 'text-green-400'
                : total <= 30
                  ? 'text-yellow-400'
                  : 'text-sky-400'
            }`}
          >
            {loading ? '…' : total.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">件</p>
        </div>

        {/* ワードクラウド */}
        <div className="w-full mb-4">
          <WordCloud
            keywords={keywords}
            onWordSelect={handleWordClick}
            disabledWords={selectedKeywords}
          />
        </div>

        {/* ドラッグ可能なキーワードチップ */}
        <div className="w-full mb-4">
          <p className="text-xs text-gray-500 mb-2">
            キーワードをドラッグしてバケツに入れる（クリックでも追加）
          </p>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <DraggableWord
                key={kw.word}
                word={kw.word}
                category={kw.category}
                disabled={selectedKeywords.includes(kw.word)}
              />
            ))}
          </div>
        </div>

        {/* DropZone */}
        <div className="w-full mb-6">
          <DropZone selectedWords={selectedKeywords} onRemove={handleRemove} />
        </div>

        {showFilterButton && (
          <button
            onClick={() => router.push('/filter')}
            className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-sm text-white font-medium transition-colors mb-3"
          >
            業界で絞り込む →
          </button>
        )}

        <button
          onClick={() => router.push('/')}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          ← やり直す
        </button>
      </main>
    </DndContext>
  )
}
