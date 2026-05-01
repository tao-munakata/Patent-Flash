'use client'

import { useState } from 'react'
import type { PatentSummary } from '@/types'

interface Props {
  patent: PatentSummary
}

export default function PatentCard({ patent }: Props) {
  const [open, setOpen] = useState(false)
  const score = Math.round(patent.similarityScore * 100)
  const scoreColor =
    score >= 70
      ? 'bg-red-900 text-red-300 border-red-700'
      : score >= 40
        ? 'bg-yellow-900 text-yellow-300 border-yellow-700'
        : 'bg-green-900 text-green-300 border-green-700'

  return (
    <div className="rounded-xl bg-gray-900 border border-gray-700 p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs text-gray-500 mb-1">
            {patent.id} · {patent.date} · {patent.assignee}
          </p>
          <h3 className="text-base font-semibold text-white">{patent.title}</h3>
        </div>
        <span
          className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full border ${scoreColor}`}
        >
          {score}% 類似
        </span>
      </div>

      <p className="text-sm text-gray-300 mb-3 leading-relaxed">{patent.summary}</p>

      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
        >
          {open ? '▲ 回避設計を隠す' : '▼ 回避設計を見る'}
        </button>
        {open && (
          <div className="mt-2 text-xs text-gray-400 bg-gray-800/60 rounded-lg p-3 border border-gray-700">
            💡 {patent.avoidanceHint}
          </div>
        )}
      </div>

      {patent.url && (
        <a
          href={patent.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs text-sky-500 hover:text-sky-400 transition-colors"
        >
          詳細を見る →
        </a>
      )}
    </div>
  )
}
