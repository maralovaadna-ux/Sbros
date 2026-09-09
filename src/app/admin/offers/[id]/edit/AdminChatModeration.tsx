'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MsgRow = { id: string; content: string; is_deleted: boolean; profiles?: { name: string } | null }

export default function AdminChatModeration({ messages }: { messages: MsgRow[] }) {
  const supabase = createClient()
  const [items, setItems] = useState(messages)

  async function deleteMessage(id: string) {
    await supabase.from('messages').update({ is_deleted: true }).eq('id', id)
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, is_deleted: true } : m)))
  }

  if (items.length === 0) return <p className="text-muted text-sm">Сообщений пока нет.</p>

  return (
    <div className="flex flex-col gap-2">
      {items.map((m) => (
        <div
          key={m.id}
          className={`rounded-lg border px-3 py-2 text-sm flex items-center justify-between gap-2 ${
            m.is_deleted ? 'bg-white/3 border-white/5 text-muted line-through' : 'bg-surface border-white/8'
          }`}
        >
          <div>
            <span className="font-semibold">{m.profiles?.name ?? 'Пользователь'}: </span>
            {m.content}
          </div>
          {!m.is_deleted && (
            <button onClick={() => deleteMessage(m.id)} className="text-accent text-xs shrink-0">
              удалить
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
