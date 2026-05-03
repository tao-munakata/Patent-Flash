import { NextRequest, NextResponse } from 'next/server'
import { getClaudeClient, CLAUDE_MODEL } from '@/lib/claude'
import type { Keyword } from '@/types'

const MOCK_KEYWORDS: Keyword[] = [
  { word: '入力手段', category: 'means', weight: 920 },
  { word: '音響信号', category: 'means', weight: 780 },
  { word: 'FFT処理', category: 'action', weight: 340 },
  { word: '周波数変換', category: 'action', weight: 560 },
  { word: '信号抽出', category: 'action', weight: 430 },
  { word: '増幅', category: 'action', weight: 870 },
  { word: 'ノイズ除去', category: 'purpose', weight: 650 },
  { word: '特定成分検出', category: 'purpose', weight: 290 },
  { word: '制御手段', category: 'means', weight: 1100 },
  { word: 'リアルタイム処理', category: 'action', weight: 480 },
  { word: '記憶手段', category: 'means', weight: 950 },
  { word: '出力制御', category: 'purpose', weight: 720 },
]

export async function POST(req: NextRequest) {
  const { text } = await req.json()

  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      keywords: MOCK_KEYWORDS,
      searchQuery: '((入力手段) AND (FFT処理) AND (音響信号))',
    })
  }

  const client = getClaudeClient()

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `あなたは特許の専門家です。
入力されたアイデアのテキストから、特許検索に有効なキーワードを抽出してください。
以下のルールに従ってください:
1. キーワードを「作用/動作(action)」「目的(purpose)」「手段(means)」に分類する
2. 一般用語を特許特有の広義語に変換する（例: ボタン→入力手段、音→音響信号、カメラ→撮像手段）
3. 各キーワードに想定ヒット件数（weight: 100~2000の整数）を付与する（一般的な言葉ほど大きい値）
4. 合計10~15個のキーワードを返す
5. 必ず以下のJSON形式のみで返す（説明文は不要）:
{"keywords":[{"word":"...","category":"action"|"purpose"|"means","weight":数値}],"searchQuery":"..."}`,
    messages: [{ role: 'user', content: text }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 })
  }

  try {
    const parsed = JSON.parse(content.text)
    return NextResponse.json(parsed)
  } catch {
    // JSON parse失敗時はモックを返す
    return NextResponse.json({
      keywords: MOCK_KEYWORDS,
      searchQuery: '((入力手段) AND (信号処理))',
    })
  }
}
