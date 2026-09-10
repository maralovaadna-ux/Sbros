'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'phone' | 'name' | 'city' | 'address' | 'done'

type ChatMsg = { from: 'admin' | 'user'; text: string }

const ADMIN_QUESTIONS: Record<Exclude<Step, 'done'>, string> = {
  phone: 'Привет! 👋 Оставьте номер телефона — мы напишем вам в WhatsApp, когда СБРОС завершится, и договоримся о доставке товара',
  name: 'Как вас зовут?',
  city: 'В каком городе вы живёте? Покажем СБРОСы с лучшей ценой именно для вашего города',
  address: 'Напишите улицу и номер дома, или название ЖК — для соседей часто бывают отдельные акции. Можно пропустить, если не хотите указывать',
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
  if (digits.startsWith('7') && digits.length === 11) return '+' + digits
  if (digits.length === 10) return '+7' + digits
  return '+' + digits
}

export default function RegisterPromptModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}) {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('phone')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setStep('phone')
      setMessages([{ from: 'admin', text: ADMIN_QUESTIONS.phone }])
      setInput('+7')
      setError(null)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!open) return null

  function pushAdmin(text: string) {
    setMessages((m) => [...m, { from: 'admin', text }])
  }
  function pushUser(text: string) {
    setMessages((m) => [...m, { from: 'user', text }])
  }

  async function handleSend() {
    const value = input.trim()
    setError(null)

    if (step === 'phone') {
      if (value.replace(/\D/g, '').length < 11) {
        setError('Введите корректный номер телефона')
        return
      }
      pushUser(value)
      setInput('')
      setStep('name')
      setTimeout(() => pushAdmin(ADMIN_QUESTIONS.name), 400)
      return
    }

    if (step === 'name') {
      if (!value) {
        setError('Напишите, как вас зовут')
        return
      }
      pushUser(value)
      setInput('')
      setStep('city')
      setTimeout(() => pushAdmin(ADMIN_QUESTIONS.city), 400)
      return
    }

    if (step === 'city') {
      if (!value) {
        setError('Напишите город')
        return
      }
      pushUser(value)
      setInput('')
      setStep('address')
      setTimeout(() => pushAdmin(ADMIN_QUESTIONS.address), 400)
      return
    }

    if (step === 'address') {
      pushUser(value || 'Пропустить')
      await finishRegistration(value)
    }
  }

  async function finishRegistration(addressRaw: string) {
    setLoading(true)
    const userMessages = messages.filter((m) => m.from === 'user')
    const phone = normalizePhone(userMessages[0]?.text ?? '')
    const name = userMessages[1]?.text ?? 'Пользователь'
    const city = userMessages[2]?.text ?? 'Актобе'
    const street = addressRaw.trim()

    try {
      const res = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Не получилось. Попробуйте ещё раз.')
        setLoading(false)
        return
      }

      const { error: signInErr, data: signInData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInErr || !signInData.session) {
        setError('Не получилось войти. Попробуйте ещё раз.')
        setLoading(false)
        return
      }

      await supabase
        .from('profiles')
        .update({
          name,
          city,
          street: street || 'не указано',
          building: '-',
        })
        .eq('id', signInData.user.id)

      setLoading(false)
      setStep('done')
      pushAdmin('Готово! Теперь вы можете участвовать 🎉')

      setTimeout(() => {
        onSuccess?.()
        onClose()
        router.refresh()
      }, 900)
    } catch (e: any) {
      setLoading(false)
      setError('Не получилось. Попробуйте ещё раз.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <div className="w-full max-w-[480px] bg-ink rounded-t-2xl flex flex-col" style={{ height: '85vh' }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-accent2/20 flex items-center justify-center text-lg">🧑</div>
            <div>
              <p className="font-bold text-sm">Админ СБРОС</p>
              <p className="text-xs text-muted">обычно отвечает мгновенно</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted text-xl px-2">
            ✕
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-3"
          style={{ backgroundColor: '#12140f' }}
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
              {m.from === 'admin' && (
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0">
                  🧑
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2.5 text-sm ${
                  m.from === 'user'
                    ? 'bg-accent2 text-ink rounded-2xl rounded-br-sm'
                    : 'bg-surface text-white rounded-2xl rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-accent text-sm px-4 pb-1">{error}</p>}

        {step !== 'done' && (
          <div className="flex gap-2 p-3 border-t border-white/10">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
              placeholder={step === 'address' ? 'Улица, дом или ЖК (необязательно)' : 'Ваш ответ…'}
              inputMode={step === 'phone' ? 'tel' : 'text'}
              autoFocus
              className="flex-1 rounded-full bg-surface border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="rounded-full bg-accent px-5 py-3 text-sm font-bold disabled:opacity-50"
            >
              {loading ? '…' : '→'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
