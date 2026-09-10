'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RegisterPromptModal from './RegisterPromptModal'
import type { Message } from '@/lib/types'

export default function Chat({
  offerId,
  userId,
  initialMessages,
  isGuest,
}: {
  offerId: string
  userId: string | null
  initialMessages: Message[]
  isGuest: boolean
}) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`offer-${offerId}-messages`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `offer_id=eq.${offerId}` },
        async (payload) => {
          const row = payload.new as Message
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

  function focusOrPrompt() {
    if (isGuest || !userId) {
      setShowPrompt(true)
      return true
    }
    return false
  }

  async function send() {
    if (focusOrPrompt()) return
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    const { error } = await supabase.from('messages').insert({ offer_id: offerId, user_id: userId, content })
    if (error) setText(content)
    setSending(false)
  }

  return (
    <div className="flex flex-col">
      <RegisterPromptModal
        open={showPrompt}
        onClose={() => setShowPrompt(false)}
        text="Чтобы писать в чат, зарегистрируйтесь — это займёт меньше минуты."
      />

      <div
        className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto no-scrollbar px-3 py-3 rounded-xl2"
        style={{
          backgroundColor: '#12140f',
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(CHAT_PATTERN_SVG)}")`,
          backgroundSize: '160px 160px',
        }}
      >
        {messages.length === 0 && (
          <p className="text-sm text-muted text-center py-6 bg-ink/60 rounded-xl2">Пока никто не писал. Начните первым.</p>
        )}
        {messages
          .filter((m) => !m.is_deleted)
          .map((m) => {
            const mine = m.user_id === userId
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0">
                  🧑
                </div>
                <div
                  className={`relative max-w-[75%] px-3 py-2 text-sm shadow-sm ${
                    mine
                      ? 'bg-accent2 text-ink rounded-2xl rounded-br-sm'
                      : 'bg-surface text-white rounded-2xl rounded-bl-sm'
                  }`}
                >
                  <div className={`text-xs mb-0.5 font-semibold ${mine ? 'text-ink/60' : 'text-accent2'}`}>
                    {m.profiles?.name ?? 'Участник'}
                  </div>
                  {m.content}
                </div>
              </div>
            )
          })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-2 sticky bottom-0 bg-ink pt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => focusOrPrompt()}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Написать сообщение…"
          maxLength={1000}
          className="flex-1 rounded-full bg-surface border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/30"
        />
        <button
          onClick={send}
          disabled={sending || (!isGuest && !text.trim())}
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-bold disabled:opacity-50"
        >
          →
        </button>
      </div>
    </div>
  )
}

// Фоновый узор в стиле WhatsApp — простые векторные значки (пакет, чек, монета,
// рукопожатие упрощённо), приглушённые, в цвет акцента (лайм), на тёмном фоне.
// Векторные path вместо эмодзи — рендерится одинаково во всех браузерах.
const CHAT_PATTERN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <g fill="none" stroke="#c8f169" stroke-opacity="0.08" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <!-- пакет с покупками -->
    <path d="M14 26 h20 l3 22 h-26 z" />
    <path d="M20 26 v-4 a4 4 0 0 1 8 0 v4" />
    <!-- галочка (готово) -->
    <path d="M96 18 l6 6 l12 -14" />
    <!-- монета -->
    <circle cx="70" cy="66" r="11" />
    <path d="M70 60 v12 M66 63 h8 M66 69 h8" />
    <!-- пакет побольше -->
    <path d="M112 70 h22 l3 24 h-28 z" />
    <path d="M118 70 v-4 a4.5 4.5 0 0 1 9 0 v4" />
    <!-- галочка -->
    <path d="M24 118 l6 6 l12 -14" />
    <!-- рукопожатие (упрощённо, две дуги) -->
    <path d="M92 122 q8 -10 18 0 q8 10 18 0" />
    <!-- монета маленькая -->
    <circle cx="140" cy="140" r="8" />
    <path d="M140 136 v8 M137 140 h6" />
  </g>
</svg>
`.trim()
