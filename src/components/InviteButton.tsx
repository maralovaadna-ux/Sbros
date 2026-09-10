'use client'

import { useState } from 'react'
import { formatTenge, currentPrice, nextTierGap, scopeLabel, unitLabel } from '@/lib/pricing'
import type { OfferWithStats } from '@/lib/types'

export default function InviteButton({ offer }: { offer: OfferWithStats }) {
  const [copied, setCopied] = useState(false)
  const count = offer.stats.participants_count
  const price = currentPrice(offer, offer.price_tiers, count)
  const gap = nextTierGap(offer.price_tiers, count)

  async function handleInvite() {
    const url = `${window.location.origin}/invite/${offer.id}`
    const gapLine = gap ? `\nЕщё ${gap.need} ${unitLabel(offer.unit, gap.need)} — и цена снизится.` : ''
    const scopeLine = scopeLabel(offer)

    const text =
      `СБРОС #${offer.offer_number}: ${offer.title}\n` +
      `${scopeLine}\n\n` +
      `Обычная цена: ${formatTenge(offer.base_price)}\n` +
      `Минимальная цена: ${formatTenge(offer.target_price)}\n` +
      `Сейчас: ${formatTenge(price)}\n\n` +
      `Уже участвуют ${count} человек.${gapLine}\n\n` +
      url

    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // пользователь отменил share/clipboard — не страшно
    }
  }

  return (
    <button
      onClick={handleInvite}
      className="w-full rounded-xl2 border border-white/15 bg-white/5 py-3.5 text-center font-bold text-white active:scale-[0.98] transition-transform"
    >
      {copied ? 'Скопировано ✓' : '📤 ПРИГЛАСИТЬ'}
    </button>
  )
}
