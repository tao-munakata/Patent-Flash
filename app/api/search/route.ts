import { NextRequest, NextResponse } from 'next/server'
import { searchPatents } from '@/lib/patents'

export async function POST(req: NextRequest) {
  const { keywords, industryTags } = await req.json()

  if (!Array.isArray(keywords)) {
    return NextResponse.json({ error: 'keywords must be an array' }, { status: 400 })
  }

  try {
    const result = await searchPatents(keywords, industryTags ?? [])
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
