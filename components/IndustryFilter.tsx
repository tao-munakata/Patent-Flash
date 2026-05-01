'use client'

const INDUSTRIES = [
  '農業', '医療', '製造', '不動産', '介護',
  '物流', '金融', '教育', '建設', 'エネルギー',
]

interface Props {
  selected: string[]
  onChange: (tags: string[]) => void
}

export default function IndustryFilter({ selected, onChange }: Props) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {INDUSTRIES.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            selected.includes(tag)
              ? 'bg-sky-600 border-sky-500 text-white'
              : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-sky-600 hover:text-sky-300'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
