'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
  if (digits.startsWith('7') && digits.length === 11) return '+' + digits
  if (digits.length === 10) return '+7' + digits
  return '+' + digits
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendCode() {
    setError(null)
    const normalized = normalizePhone(phone)
    if (normalized.length < 11) {
      setError('Введите корректный номер телефона')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithOtp({ phone: normalized })
    setLoading(false)
    if (err) {
      setError('Не получилось отправить код. Проверьте номер.')
      return
    }
    setPhone(normalized)
    setStep('code')
  }

  async function verifyCode() {
    setError(null)
    setLoading(true)
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    })
    setLoading(false)
    if (err || !data.session) {
      setError('Неверный код. Попробуйте ещё раз.')
      return
    }

    // проверяем, заполнен ли уже адрес (профиль создаётся триггером автоматически)
    const { data: profile } = await supabase
      .from('profiles')
      .select('street, building, city')
      .eq('id', data.user!.id)
      .single()

    if (!profile || !profile.street || !profile.building) {
      router.push('/onboarding')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="flex flex-col justify-center min-h-screen px-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">СБРОС</h1>
        <p className="text-muted mt-2">Чем больше вас — тем ниже цена</p>
      </div>

      {step === 'phone' ? (
        <>
          <label className="text-sm text-muted mb-2 block">Номер телефона</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 700 000 00 00"
            inputMode="tel"
            className="w-full rounded-xl2 bg-surface border border-white/10 px-4 py-3.5 text-lg outline-none focus:border-white/30 mb-4"
          />
          {error && <p className="text-accent text-sm mb-4">{error}</p>}
          <button
            onClick={sendCode}
            disabled={loading}
            className="w-full rounded-xl2 bg-accent py-4 text-lg font-extrabold disabled:opacity-60"
          >
            {loading ? 'Отправка…' : 'ПОЛУЧИТЬ КОД'}
          </button>
          <p className="text-xs text-muted mt-4 text-center">
            Номер телефона используется только для входа. Он никогда не виден другим пользователям.
          </p>
        </>
      ) : (
        <>
          <label className="text-sm text-muted mb-2 block">Код из SMS</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
            className="w-full rounded-xl2 bg-surface border border-white/10 px-4 py-3.5 text-lg outline-none focus:border-white/30 mb-4 tracking-widest text-center"
          />
          {error && <p className="text-accent text-sm mb-4">{error}</p>}
          <button
            onClick={verifyCode}
            disabled={loading}
            className="w-full rounded-xl2 bg-accent py-4 text-lg font-extrabold disabled:opacity-60"
          >
            {loading ? 'Проверка…' : 'ВОЙТИ'}
          </button>
          <button onClick={() => setStep('phone')} className="w-full py-3 text-sm text-muted mt-2">
            Изменить номер
          </button>
        </>
      )}
    </div>
  )
}
