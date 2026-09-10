import Link from 'next/link'
import ProgressBar from './ProgressBar'
import ScopeBadge from './ScopeBadge'
import Countdown from './Countdown'
import { formatTenge, nextTierGap, progressPercent, unitCountLabel, unitLabel, isOfferFinished, manualSoldLabel } from '@/lib/pricing'
import type { OfferWithStats } from '@/lib/types'

export default function OfferCard({ offer }: { offer: OfferWithStats }) {
  const count = offer.stats.participants_count
  const gap = nextTierGap(offer.price_tiers, count)
  const pct = progressPercent(count, offer.target_participants)
  const finished = isOfferFinished(offer)

  return (
    <Link
      href={`/offer/${offer.id}`}
      className={`block rounded-xl2 bg-surface border p-4 active:scale-[0.98] transition-transform ${
        finished ? 'border-white/5 opacity-70' : 'border-white/8'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <ScopeBadge offer={offer} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">#{offer.offer_number}</span>
          {finished ? (
            <span className="text-xs font-bold text-muted bg-white/10 rounded-full px-2 py-0.5">ЗАКОНЧЕН</span>
          ) : (
            <Countdown endsAt={offer.ends_at} compact />
          )}
        </div>
      </div>

      {offer.image_urls?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={offer.image_urls[0]}
          alt={offer.title}
          className="w-full h-36 object-contain bg-black rounded-lg mb-3"
        />
      )}

      <h3 className="text-lg font-bold leading-tight mb-1">{offer.title}</h3>
      {offer.description && (
        <p className="text-sm text-muted mb-3 line-clamp-1">{offer.description}</p>
      )}

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-sm text-muted line-through">{formatTenge(offer.base_price)}</span>
        <span className="text-2xl font-extrabold text-accent2">{formatTenge(offer.target_price)}</span>
      </div>

      <ProgressBar percent={pct} />

      <div className="flex items-center justify-between mt-2 text-sm gap-2">
        <span className="font-semibold">
          {unitCountLabel(offer.unit, count)} / {unitCountLabel(offer.unit, offer.target_participants)}
        </span>
        {offer.manual_sold_count != null ? (
          <span className="text-xs font-bold text-accent">
            {manualSoldLabel(offer)}
          </span>
        ) : (
          gap && <span className="text-muted">ещё {gap.need} {unitLabel(offer.unit, gap.need)}</span>
        )}
      </div>
    </Link>
  )
}
