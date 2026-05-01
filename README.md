# Patent-Flash

音声・テキストで入力したアイデアから AI がキーワードを抽出し、ゲーム感覚のUIで類似特許を絞り込める一次調査高速化Webアプリ。

## セットアップ

```bash
cp .env.local.example .env.local
# .env.local に ANTHROPIC_API_KEY を記入（省略可、モックで動作）
npm install
npm run dev
```

http://localhost:3000 にアクセス。

## 画面構成

1. **入力** (`/`) — テキスト入力 + Web Speech API 音声入力
2. **バブル** (`/results`) — キーワードクラウド + DnD 絞り込みバケツ
3. **フィルタ** (`/filter`) — 業界タグ選択
4. **詳細** (`/details`) — 特許カード + 類似度・回避設計ヒント

## 環境変数

| 変数 | 説明 |
|------|------|
| `ANTHROPIC_API_KEY` | Claude API キー（未設定時はモックデータ） |
| `SERPAPI_KEY` | Google Patents 検索用（未設定時はモックデータ） |
