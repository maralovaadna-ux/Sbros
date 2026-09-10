'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTo = searchParams.get('redirect') || '/'

  function handlePhoneChange(value: string) {
    // +7 всегда закреплён спереди, пользователь редактирует только остаток
    const digitsAfterPrefix = value.replace(/^\+7/, '').replace(/\D/g, '')
    setPhone('+7' + digitsAfterPrefix)
  }

  async function enter() {
    setError(null)
    if (phone.replace(/\D/g, '').length < 11) {
      setError('Введите корректный номер телефона')
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Не получилось войти. Попробуйте ещё раз.')
        setLoading(false)
        return
      }

      const { error: signInErr, data: signInData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      setLoading(false)

      if (signInErr || !signInData.session) {
        setError('Не получилось войти. Попробуйте ещё раз.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('street, building, city')
        .eq('id', signInData.user.id)
        .single()

      if (!profile || !profile.street || !profile.building) {
        router.push(`/onboarding?redirect=${encodeURIComponent(redirectTo)}`)
      } else {
        router.push(redirectTo)
      }
      router.refresh()
    } catch (e: any) {
      setLoading(false)
      setError('Не получилось войти. Попробуйте ещё раз.')
    }
  }

  return (
    <div className="flex flex-col justify-center min-h-screen px-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">СБРОС</h1>
        <p className="text-muted mt-2">Чем больше вас — тем ниже цена</p>
      </div>

      <label className="text-sm text-muted mb-2 block">Номер телефона</label>
      <input
        value={phone || '+7'}
        onChange={(e) => handlePhoneChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && enter()}
        placeholder="+7 700 000 00 00"
        inputMode="tel"
        className="w-full rounded-xl2 bg-surface border border-white/10 px-4 py-3.5 text-lg outline-none focus:border-white/30 mb-4"
      />
      {error && <p className="text-accent text-sm mb-4">{error}</p>}
      <button
        onClick={enter}
        disabled={loading}
        className="w-full rounded-xl2 bg-accent py-4 text-lg font-extrabold disabled:opacity-60"
      >
        {loading ? 'Входим…' : 'ВОЙТИ'}
      </button>
      <p className="text-xs text-muted mt-4 text-center">
        Номер телефона используется только как логин и никогда не виден другим пользователям.
        Если вы заходите впервые — аккаунт создастся автоматически.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
