'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [city, setCity] = useState('Актобе')
  const [district, setDistrict] = useState('')
  const [complex, setComplex] = useState('')
  const [street, setStreet] = useState('')
  const [building, setBuilding] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTo = searchParams.get('redirect') || '/'

  async function save() {
    setError(null)
    if (!name.trim() || !city.trim() || !street.trim() || !building.trim()) {
      setError('Заполните имя, город, улицу и номер дома')
      return
    }
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Сессия истекла, войдите заново')
      setLoading(false)
      return
    }

    const { error: err } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        city: city.trim(),
        district: district.trim() || null,
        residential_complex: complex.trim() || null,
        street: street.trim(),
        building: building.trim(),
      })
      .eq('id', user.id)

    setLoading(false)
    if (err) {
      setError('Не получилось сохранить. Попробуйте ещё раз.')
      return
    }
    router.push(redirectTo)
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-10">
      <h1 className="text-2xl font-extrabold mb-1">Ваш адрес</h1>
      <p className="text-muted mb-8 text-sm">
        Нужен, чтобы показывать предложения для вашего дома, ЖК и района. Номер квартиры пока не требуется.
      </p>

      <div className="flex flex-col gap-4">
        <Field label="Имя или никнейм" value={name} onChange={setName} placeholder="Айбек" />
        <Field label="Город" value={city} onChange={setCity} placeholder="Актобе" />
        <Field label="Район (необязательно)" value={district} onChange={setDistrict} placeholder="Астана" />
        <Field label="ЖК (если есть)" value={complex} onChange={setComplex} placeholder="Альтаир" />
        <Field label="Улица" value={street} onChange={setStreet} placeholder="Абая" />
        <Field label="Номер дома" value={building} onChange={setBuilding} placeholder="15" />
      </div>

      {error && <p className="text-accent text-sm mt-4">{error}</p>}

      <button
        onClick={save}
        disabled={loading}
        className="w-full rounded-xl2 bg-accent py-4 text-lg font-extrabold disabled:opacity-60 mt-8"
      >
        {loading ? 'Сохранение…' : 'ПРОДОЛЖИТЬ'}
      </button>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingForm />
    </Suspense>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="text-sm text-muted mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl2 bg-surface border border-white/10 px-4 py-3 outline-none focus:border-white/30"
      />
    </div>
  )
}
