'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types'

export default function Chat({
  offerId,
  userId,
  initialMessages,
}: {
  offerId: string
  userId: string
  initialMessages: Message[]
}) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`offer-${offerId}-messages`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `offer_id=eq.${offerId}` },
        async (payload) => {
          const row = payload.new as Message
          // подтягиваем имя/аватар автора (без телефона — его в таблице нет физически)
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', row.user_id)
            .single()
          setMessages((prev) => [...prev, { ...row, profiles: profile ?? undefined }])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function send() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    const { error } = await supabase.from('messages').insert({ offer_id: offerId, user_id: userId, content })
    if (error) setText(content) // вернуть текст, если не отправилось
    setSending(false)
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto no-scrollbar px-1 py-2">
        {messages.length === 0 && (
          <p className="text-sm text-muted text-center py-6">Пока никто не писал. Начните первым.</p>
        )}
        {messages
          .filter((m) => !m.is_deleted)
          .map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.user_id === userId ? 'flex-row-reverse' : ''}`}>
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0">
                🧑
              </div>
              <div
                className={`max-w-[75%] rounded-xl2 px-3 py-2 text-sm ${
                  m.user_id === userId ? 'bg-accent text-white' : 'bg-white/8 text-white'
                }`}
              >
                <div className="text-xs opacity-70 mb-0.5">{m.profiles?.name ?? 'Участник'}</div>
                {m.content}
              </div>
            </div>
          ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-2 sticky bottom-0 bg-ink pt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Написать сообщение…"
          maxLength={1000}
          className="flex-1 rounded-full bg-surface border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/30"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-bold disabled:opacity-50"
        >
          →
        </button>
      </div>
    </div>
  )
}
