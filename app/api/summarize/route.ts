import { NextRequest, NextResponse } from 'next/server'
import { getClaudeClient, CLAUDE_MODEL } from '@/lib/claude'
import type { Patent, PatentSummary } from '@/types'

const MOCK_HINTS = [
  '機能的クレームを用いて手段の実装を限定しない請求にすることで差異化が可能',
  '素材・材料の指定を避け、特性値（強度・伝導率など）で限定することで範囲を広げられる',
  '処理ステップの順序を変更するか、一部を省略した構成で回避設計が可能',
  '異なる周波数帯や変調方式を採用することで技術的距離を確保できる',
]

export async function POST(req: NextRequest) {
  const { patents, originalIdea } = (await req.json()) as {
    patents: Patent[]
    originalIdea: string
  }

  if (!Array.isArray(patents) || patents.length === 0) {
    return NextResponse.json({ summaries: [] })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const summaries: PatentSummary[] = patents.map((p, i) => ({
      ...p,
      summary: `${p.title}。${p.abstract.slice(0, 60)}...`,
      similarityScore: parseFloat((Math.random() * 0.5 + 0.25).toFixed(2)),
      avoidanceHint: MOCK_HINTS[i % MOCK_HINTS.length],
    }))
    return NextResponse.json({ summaries })
  }

  const client = getClaudeClient()
  const patentListText = patents
    .map(
      (p, i) =>
        `[${i + 1}] ID:${p.id}\nタイトル:${p.title}\n要約:${p.abstract}\n出願人:${p.assignee}`
    )
    .join('\n\n')

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `あなたは特許調査の専門家です。元のアイデアと特許リストを照合し、各特許について以下をJSON配列で返してください:
- id: 特許ID（入力のまま）
- summary: 3行以内の要約（日本語）
- similarityScore: 元のアイデアとの類似度（0.0〜1.0）
- avoidanceHint: 侵害を回避するための設計示唆（1文）
必ずJSON形式のみで返してください: {"summaries":[{"id":"...","summary":"...","similarityScore":0.0,"avoidanceHint":"..."}]}`,
    messages: [
      {
        role: 'user',
        content: `元のアイデア: ${originalIdea}\n\n特許リスト:\n${patentListText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 })
  }

  try {
    const parsed = JSON.parse(content.text) as {
      summaries: Array<{
        id: string
        summary: string
        similarityScore: number
        avoidanceHint: string
      }>
    }
    const summaries: PatentSummary[] = patents.map((p, i) => {
      const a = parsed.summaries.find((s) => s.id === p.id) ?? parsed.summaries[i]
      return {
        ...p,
        summary: a?.summary ?? p.abstract.slice(0, 80),
        similarityScore: a?.similarityScore ?? 0.5,
        avoidanceHint: a?.avoidanceHint ?? '',
      }
    })
    return NextResponse.json({ summaries })
  } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 500 })
  }
}
