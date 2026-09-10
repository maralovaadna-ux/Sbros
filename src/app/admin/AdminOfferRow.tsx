'use client'

import { useState } from 'react'
import Link from 'next/link'
import { scopeLabel, formatTenge } from '@/lib/pricing'
import type { Offer, OfferStats } from '@/lib/types'

export default function AdminOfferRow({ offer, stats }: { offer: Offer; stats?: OfferStats }) {
  const [copied, setCopied] = useState(false)

  async function copyLink(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/invite/${offer.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard недоступен — не страшно, просто ничего не произойдёт
    }
  }

  return (
    <Link
      href={`/admin/offers/${offer.id}/edit`}
      className="rounded-xl2 bg-surface border border-white/8 p-4 block"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold">#{offer.offer_number} {offer.title}</h3>
        {!offer.is_active && (
          <span className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-muted">выкл</span>
        )}
      </div>
      <p className="text-xs text-muted mb-2">{scopeLabel(offer)}</p>
      <div className="flex items-center justify-between text-sm mb-3">
        <span>{stats?.participants_count ?? 0} / {offer.target_participants} участников</span>
        <span className="font-semibold text-accent2">{formatTenge(stats?.current_price ?? offer.base_price)}</span>
      </div>
      <button
        onClick={copyLink}
        className="w-full rounded-lg bg-white/5 border border-white/10 py-2 text-xs font-semibold text-accent2"
      >
        {copied ? '✓ Ссылка скопирована' : '🔗 Скопировать ссылку-приглашение'}
      </button>
    </Link>
  )
}
