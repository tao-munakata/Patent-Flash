import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '特許フラッシュ',
  description: 'AIキーワード抽出で特許一次調査を高速化',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${inter.className} h-full`}>
      <body className="min-h-full bg-gray-950 text-white">{children}</body>
    </html>
  )
}
