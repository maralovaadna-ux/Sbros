import Link from 'next/link'
import ProgressBar from './ProgressBar'
import ScopeBadge from './ScopeBadge'
import { currentPrice, formatTenge, nextTierGap, progressPercent } from '@/lib/pricing'
import type { OfferWithStats } from '@/lib/types'

export default function OfferCard({ offer }: { offer: OfferWithStats }) {
  const count = offer.stats.participants_count
  const price = currentPrice(offer, offer.price_tiers, count)
  const gap = nextTierGap(offer.price_tiers, count)
  const pct = progressPercent(count, offer.target_participants)

  return (
    <Link
      href={`/offer/${offer.id}`}
      className="block rounded-xl2 bg-surface border border-white/8 p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <ScopeBadge offer={offer} />
      </div>

      {offer.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={offer.image_url}
          alt={offer.title}
          className="w-full h-36 object-cover rounded-lg mb-3"
        />
      )}

      <h3 className="text-lg font-bold leading-tight mb-1">{offer.title}</h3>
      {offer.description && (
        <p className="text-sm text-muted mb-3 line-clamp-1">{offer.description}</p>
      )}

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-sm text-muted line-through">{formatTenge(offer.base_price)}</span>
        <span className="text-2xl font-extrabold text-accent2">{formatTenge(price)}</span>
      </div>

      <ProgressBar percent={pct} />

      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="font-semibold">
          {count} / {offer.target_participants} участников
        </span>
        {gap && <span className="text-muted">ещё {gap.need} чел.</span>}
      </div>
    </Link>
  )
}
