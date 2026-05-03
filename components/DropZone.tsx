'use client'

import { useDroppable } from '@dnd-kit/core'

interface Props {
  selectedWords: string[]
  onRemove: (word: string) => void
}

export default function DropZone({ selectedWords, onRemove }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bucket' })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-24 rounded-xl border-2 border-dashed p-4 transition-all ${
        isOver
          ? 'border-sky-400 bg-sky-950/40 scale-[1.01]'
          : 'border-gray-600 bg-gray-900/40'
      }`}
    >
      <p className="text-xs text-gray-500 mb-2">
        🪣 絞り込みバケツ — キーワードをここにドロップ
      </p>
      <div className="flex flex-wrap gap-2">
        {selectedWords.length === 0 ? (
          <span className="text-xs text-gray-600 italic">まだ追加されていません</span>
        ) : (
          selectedWords.map((word) => (
            <span
              key={word}
              className="inline-flex items-center gap-1 text-xs bg-sky-900 text-sky-200 border border-sky-700 px-2 py-1 rounded-full"
            >
              {word}
              <button
                onClick={() => onRemove(word)}
                className="text-sky-400 hover:text-white ml-0.5 leading-none"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  )
}
