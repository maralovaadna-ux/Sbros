import type { Offer, PriceTier, ScopeType, UnitType } from './types'
import { SCOPE_ICONS, SCOPE_LABELS, UNIT_LABELS } from './types'

/** Текущая цена по количеству участников и таблице уровней. */
export function currentPrice(offer: Offer, tiers: PriceTier[], participantsCount: number): number {
  const applicable = tiers
    .filter((t) => t.min_participants <= participantsCount)
    .sort((a, b) => b.min_participants - a.min_participants)
  return applicable[0]?.price ?? offer.base_price
}

/** Сколько человек не хватает до следующего более выгодного уровня. */
export function nextTierGap(tiers: PriceTier[], participantsCount: number): { need: number; nextPrice: number } | null {
  const next = tiers
    .filter((t) => t.min_participants > participantsCount)
    .sort((a, b) => a.min_participants - b.min_participants)[0]
  if (!next) return null
  return { need: next.min_participants - participantsCount, nextPrice: next.price }
}

export function progressPercent(participantsCount: number, targetParticipants: number): number {
  return Math.min(100, Math.round((participantsCount / targetParticipants) * 100))
}

export function formatTenge(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(amount)) + ' ₸'
}

export function scopeLabel(offer: Pick<Offer, 'scope_type' | 'city' | 'district' | 'residential_complex' | 'street' | 'building' | 'custom_scope_label'>): string {
  switch (offer.scope_type) {
    case 'country':
      return `${SCOPE_ICONS.country} Весь Казахстан`
    case 'city':
      return `${SCOPE_ICONS.city} Для жителей ${offer.city}`
    case 'district':
      return `${SCOPE_ICONS.district} Для района «${offer.district}», ${offer.city}`
    case 'residential_complex':
      return `${SCOPE_ICONS.residential_complex} Для жителей ЖК «${offer.residential_complex}»`
    case 'building':
      return `${SCOPE_ICONS.building} Для дома: ${offer.street} ${offer.building}`
    case 'custom':
      return `${SCOPE_ICONS.custom} ${offer.custom_scope_label ?? 'Особая группа'}`
  }
}

export function scopeShort(scope: ScopeType): string {
  return `${SCOPE_ICONS[scope]} ${SCOPE_LABELS[scope]}`
}

export function unitLabel(unit: UnitType, count: number): string {
  const l = UNIT_LABELS[unit]
  return unit === 'participants' ? l.plural : `${l.short}`
}

export function unitCountLabel(unit: UnitType, count: number): string {
  const l = UNIT_LABELS[unit]
  if (unit === 'participants') return `${count} ${l.plural}`
  return `${count} ${l.short}`
}

/** Оставшееся время до ends_at в человекочитаемом виде: "2 дня 4 ч 12 мин" */
export function timeLeft(endsAt: string): { text: string; expired: boolean } {
  const diffMs = new Date(endsAt).getTime() - Date.now()
  if (diffMs <= 0) return { text: 'Завершено', expired: true }

  const totalMinutes = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days} д`)
  if (hours > 0 || days > 0) parts.push(`${hours} ч`)
  parts.push(`${minutes} мин`)

  return { text: parts.join(' '), expired: false }
}

export function manualSoldLabel(offer: Pick<Offer, 'manual_sold_count' | 'manual_sold_price' | 'target_participants'>): string | null {
  if (offer.manual_sold_count == null) return null
  const priceLine = offer.manual_sold_price != null ? ` по ${formatTenge(offer.manual_sold_price)}` : ''
  return `Продано ${offer.manual_sold_count}/${offer.target_participants}${priceLine}`
}

export function isOfferFinished(offer: Pick<Offer, 'ends_at' | 'status'>): boolean {
  if (offer.status === 'finished') return true
  return new Date(offer.ends_at).getTime() <= Date.now()
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
