import type { Offer, PriceTier, ScopeType } from './types'
import { SCOPE_ICONS, SCOPE_LABELS } from './types'

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

export function scopeLabel(offer: Pick<Offer, 'scope_type' | 'city' | 'district' | 'residential_complex' | 'street' | 'building'>): string {
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
  }
}

export function scopeShort(scope: ScopeType): string {
  return `${SCOPE_ICONS[scope]} ${SCOPE_LABELS[scope]}`
}
