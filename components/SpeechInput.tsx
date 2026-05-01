'use client'

import { useState } from 'react'

interface Props {
  onResult: (text: string) => void
}

export default function SpeechInput({ onResult }: Props) {
  const [recording, setRecording] = useState(false)

  const toggle = () => {
    const w = window as unknown as Record<string, unknown>
    const SR = w['SpeechRecognition'] ?? w['webkitSpeechRecognition']

    if (!SR) {
      alert('このブラウザは音声入力をサポートしていません')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new (SR as any)()
    rec.lang = 'ja-JP'
    rec.continuous = false
    rec.interimResults = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      onResult(e.results[0][0].transcript)
      setRecording(false)
    }
    rec.onerror = () => setRecording(false)
    rec.onend = () => setRecording(false)

    setRecording(true)
    rec.start()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl transition-colors ${
        recording ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-800 hover:bg-gray-700'
      }`}
      title={recording ? '録音中...' : '音声入力'}
    >
      🎙️
    </button>
  )
}
