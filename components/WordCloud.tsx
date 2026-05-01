'use client'

import { useEffect, useRef, useState } from 'react'
import type { Keyword } from '@/types'

interface CloudWord {
  text: string
  size: number
  x: number
  y: number
  rotate: number
  category: 'action' | 'purpose' | 'means'
}

const CATEGORY_COLORS: Record<string, string> = {
  action: '#38BDF8',
  purpose: '#4ADE80',
  means: '#FB923C',
}

const W = 700
const H = 360

interface Props {
  keywords: Keyword[]
  onWordSelect: (word: string) => void
  disabledWords: string[]
}

export default function WordCloud({ keywords, onWordSelect, disabledWords }: Props) {
  const [cloudWords, setCloudWords] = useState<CloudWord[]>([])
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!keywords.length) return

    import('d3-cloud').then((mod) => {
      const layout = mod.default<{
        text: string
        size: number
        category: string
        x?: number
        y?: number
        rotate?: number
      }>()

      layout
        .size([W, H])
        .words(
          keywords.map((kw) => ({
            text: kw.word,
            size: Math.max(14, Math.min(72, Math.round(kw.weight / 18))),
            category: kw.category,
          }))
        )
        .padding(6)
        .rotate(() => (Math.random() > 0.8 ? 90 : 0))
        .font('Arial')
        .fontSize((d) => d.size ?? 14)
        .on('end', (out) => {
          if (!mounted.current) return
          setCloudWords(out as unknown as CloudWord[])
        })
        .start()
    })
  }, [keywords])

  return (
    <svg width="100%" viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`} style={{ height: H }}>
      {cloudWords.map((w) => {
        const disabled = disabledWords.includes(w.text)
        return (
          <text
            key={w.text}
            fontSize={w.size}
            fontFamily="Arial"
            fill={disabled ? '#4b5563' : (CATEGORY_COLORS[w.category] ?? '#aaa')}
            opacity={disabled ? 0.3 : 1}
            textAnchor="middle"
            transform={`translate(${w.x ?? 0},${w.y ?? 0}) rotate(${w.rotate ?? 0})`}
            style={{
              cursor: disabled ? 'default' : 'pointer',
              transition: 'opacity 0.2s, fill 0.2s',
            }}
            onClick={() => !disabled && onWordSelect(w.text)}
          >
            {w.text}
          </text>
        )
      })}
    </svg>
  )
}
