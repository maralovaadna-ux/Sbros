'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Offer, PriceTier, ScopeType } from '@/lib/types'
import { SCOPE_ICONS, SCOPE_LABELS } from '@/lib/types'

type TierDraft = { min_participants: string; price: string }

export default function OfferForm({
  existing,
  existingTiers,
}: {
  existing?: Offer
  existingTiers?: PriceTier[]
}) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [imageUrl, setImageUrl] = useState(existing?.image_url ?? '')
  const [basePrice, setBasePrice] = useState(String(existing?.base_price ?? ''))
  const [targetPrice, setTargetPrice] = useState(String(existing?.target_price ?? ''))
  const [targetParticipants, setTargetParticipants] = useState(String(existing?.target_participants ?? ''))
  const [endsAt, setEndsAt] = useState(existing?.ends_at ? existing.ends_at.slice(0, 10) : '')
  const [isActive, setIsActive] = useState(existing?.is_active ?? true)

  const [scopeType, setScopeType] = useState<ScopeType>(existing?.scope_type ?? 'city')
  const [city, setCity] = useState(existing?.city ?? 'Актобе')
  const [district, setDistrict] = useState(existing?.district ?? '')
  const [complex, setComplex] = useState(existing?.residential_complex ?? '')
  const [street, setStreet] = useState(existing?.street ?? '')
  const [building, setBuilding] = useState(existing?.building ?? '')

  const [tiers, setTiers] = useState<TierDraft[]>(
    existingTiers && existingTiers.length > 0
      ? existingTiers.map((t) => ({ min_participants: String(t.min_participants), price: String(t.price) }))
      : [{ min_participants: '1', price: '' }]
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addTier() {
    setTiers([...tiers, { min_participants: '', price: '' }])
  }
  function updateTier(i: number, key: keyof TierDraft, value: string) {
    setTiers(tiers.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)))
  }
  function removeTier(i: number) {
    setTiers(tiers.filter((_, idx) => idx !== i))
  }

  async function save() {
    setError(null)
    if (!title.trim() || !basePrice || !targetPrice || !targetParticipants || !endsAt) {
      setError('Заполните все обязательные поля')
      return
    }
    if (scopeType !== 'country' && !city.trim()) {
      setError('Укажите город')
      return
    }
    if (scopeType === 'district' && !district.trim()) {
      setError('Укажите район')
      return
    }
    if (scopeType === 'residential_complex' && !complex.trim()) {
      setError('Укажите ЖК')
      return
    }
    if (scopeType === 'building' && (!street.trim() || !building.trim())) {
      setError('Укажите улицу и дом')
      return
    }

    setSaving(true)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      base_price: Number(basePrice),
      target_price: Number(targetPrice),
      target_participants: Number(targetParticipants),
      ends_at: new Date(endsAt + 'T23:59:59').toISOString(),
      is_active: isActive,
      scope_type: scopeType,
      city: scopeType === 'country' ? null : city.trim(),
      district: scopeType === 'district' ? district.trim() : null,
      residential_complex: scopeType === 'residential_complex' ? complex.trim() : null,
      street: scopeType === 'building' ? street.trim() : null,
      building: scopeType === 'building' ? building.trim() : null,
    }

    let offerId = existing?.id

    if (existing) {
      const { error: err } = await supabase.from('offers').update(payload).eq('id', existing.id)
      if (err) {
        setError('Не получилось сохранить: ' + err.message)
        setSaving(false)
        return
      }
    } else {
      const { data, error: err } = await supabase.from('offers').insert(payload).select('id').single()
      if (err || !data) {
        setError('Не получилось создать: ' + err?.message)
        setSaving(false)
        return
      }
      offerId = data.id
    }

    // пересобираем уровни цен: удаляем старые, вставляем новые
    if (offerId) {
      await supabase.from('price_tiers').delete().eq('offer_id', offerId)
      const validTiers = tiers
        .filter((t) => t.min_participants && t.price)
        .map((t) => ({
          offer_id: offerId,
          min_participants: Number(t.min_participants),
          price: Number(t.price),
        }))
      if (validTiers.length > 0) {
        await supabase.from('price_tiers').insert(validTiers)
      }
    }

    setSaving(false)
    router.push('/admin')
    router.refresh()
  }

  async function handleDelete() {
    if (!existing) return
    if (!confirm('Удалить это предложение навсегда?')) return
    await supabase.from('offers').delete().eq('id', existing.id)
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <Field label="Название *" value={title} onChange={setTitle} placeholder="Мясной набор" />
      <TextArea label="Описание" value={description} onChange={setDescription} placeholder="5 кг мяса, фарш, курица" />
      <Field label="Ссылка на фото (URL)" value={imageUrl} onChange={setImageUrl} placeholder="https://…" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Обычная цена *" value={basePrice} onChange={setBasePrice} placeholder="35000" type="number" />
        <Field label="Целевая цена *" value={targetPrice} onChange={setTargetPrice} placeholder="29900" type="number" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Кол-во участников *" value={targetParticipants} onChange={setTargetParticipants} placeholder="50" type="number" />
        <Field label="Дата окончания *" value={endsAt} onChange={setEndsAt} type="date" />
      </div>

      <div>
        <label className="text-sm text-muted mb-2 block">Для кого действует предложение *</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SCOPE_LABELS) as ScopeType[]).map((s) => (
            <button
              key={s}
              onClick={() => setScopeType(s)}
              className={`rounded-xl2 px-3 py-3 text-sm font-semibold border ${
                scopeType === s ? 'bg-white text-ink border-white' : 'bg-surface border-white/10 text-muted'
              }`}
            >
              {SCOPE_ICONS[s]} {SCOPE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {scopeType !== 'country' && <Field label="Город *" value={city} onChange={setCity} placeholder="Актобе" />}
      {scopeType === 'district' && <Field label="Район *" value={district} onChange={setDistrict} placeholder="Астана" />}
      {scopeType === 'residential_complex' && (
        <Field label="ЖК *" value={complex} onChange={setComplex} placeholder="Альтаир" />
      )}
      {scopeType === 'building' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Улица *" value={street} onChange={setStreet} placeholder="Абая" />
          <Field label="Дом *" value={building} onChange={setBuilding} placeholder="15" />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-muted">Уровни цены (от N участников)</label>
          <button onClick={addTier} className="text-sm text-accent2 font-semibold">
            + уровень
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {tiers.map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={t.min_participants}
                onChange={(e) => updateTier(i, 'min_participants', e.target.value)}
                placeholder="от N чел."
                type="number"
                className="w-1/3 rounded-lg bg-surface border border-white/10 px-3 py-2 text-sm outline-none"
              />
              <input
                value={t.price}
                onChange={(e) => updateTier(i, 'price', e.target.value)}
                placeholder="цена ₸"
                type="number"
                className="flex-1 rounded-lg bg-surface border border-white/10 px-3 py-2 text-sm outline-none"
              />
              <button onClick={() => removeTier(i)} className="text-muted px-2">
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Предложение активно (видно пользователям)
      </label>

      {error && <p className="text-accent text-sm">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-xl2 bg-accent py-4 font-extrabold disabled:opacity-60"
      >
        {saving ? 'Сохранение…' : existing ? 'СОХРАНИТЬ' : 'СОЗДАТЬ ПРЕДЛОЖЕНИЕ'}
      </button>

      {existing && (
        <button onClick={handleDelete} className="w-full text-center text-accent text-sm py-2">
          Удалить предложение
        </button>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="text-sm text-muted mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full rounded-xl2 bg-surface border border-white/10 px-4 py-3 outline-none focus:border-white/30"
      />
    </div>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="text-sm text-muted mb-1.5 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl2 bg-surface border border-white/10 px-4 py-3 outline-none focus:border-white/30"
      />
    </div>
  )
}
