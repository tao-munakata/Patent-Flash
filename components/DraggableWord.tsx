'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

const CATEGORY_COLORS: Record<string, string> = {
  action: '#38BDF8',
  purpose: '#4ADE80',
  means: '#FB923C',
}

interface Props {
  word: string
  category: 'action' | 'purpose' | 'means'
  disabled?: boolean
}

export default function DraggableWord({ word, category, disabled }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: word,
    disabled,
  })

  const color = CATEGORY_COLORS[category]

  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Transform.toString(transform),
        borderColor: disabled ? '#374151' : color,
        color: disabled ? '#6b7280' : color,
        opacity: isDragging ? 0.5 : disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 50 : undefined,
        position: isDragging ? 'relative' : undefined,
      }}
      className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full border select-none touch-none"
    >
      {word}
    </span>
  )
}
