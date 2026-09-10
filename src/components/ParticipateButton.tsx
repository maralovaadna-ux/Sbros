'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { currentPrice, nextTierGap, progressPercent, scopeLabel, unitCountLabel, unitLabel, formatTenge } from '@/lib/pricing'
import ProgressBar from './ProgressBar'
import Countdown from './Countdown'
import RegisterPromptModal from './RegisterPromptModal'
import type { OfferWithStats } from '@/lib/types'

export default function ParticipateButton({
  offer,
  userId,
  initialCount,
  initiallyJoined,
  hasAccess,
  isGuest,
}: {
  offer: OfferWithStats
  userId: string | null
  initialCount: number
  initiallyJoined: boolean
  hasAccess: boolean
  isGuest: boolean
}) {
  const supabase = createClient()
  const [count, setCount] = useState(initialCount)
  const [joined, setJoined] = useState(initiallyJoined)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel(`offer-${offer.id}-participations`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participations', filter: `offer_id=eq.${offer.id}` },
        () => {
          supabase
            .from('participations')
            .select('id', { count: 'exact', head: true })
            .eq('offer_id', offer.id)
            .then(({ count: c }) => {
              if (typeof c === 'number') setCount(c)
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer.id])

  function handleParticipate() {
    if (isGuest || !userId) {
      setShowPrompt(true)
      return
    }
    setError(null)
    startTransition(async () => {
      const { error: insertError } = await supabase
        .from('participations')
        .insert({ offer_id: offer.id, user_id: userId })
      if (insertError) {
        setError('Не получилось. Попробуйте ещё раз.')
        return
      }
      setJoined(true)
      setCount((c) => c + 1)
    })
  }

  const price = currentPrice(offer, offer.price_tiers, count)
  const gap = nextTierGap(offer.price_tiers, count)
  const pct = progressPercent(count, offer.target_participants)

  return (
    <div>
      <RegisterPromptModal
        open={showPrompt}
        onClose={() => setShowPrompt(false)}
        text="Чтобы участвовать в СБРОСе, зарегистрируйтесь — это займёт меньше минуты."
      />

      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold">
          {unitCountLabel(offer.unit, count)} / {unitCountLabel(offer.unit, offer.target_participants)}
        </span>
        <span className="text-sm text-muted">{pct}%</span>
      </div>
      <ProgressBar percent={pct} />
      <div className="flex items-center justify-between mt-2">
        {gap ? (
          <p className="text-sm text-muted">
            До цены {formatTenge(gap.nextPrice)} осталось{' '}
            <span className="text-white font-semibold">{gap.need} {unitLabel(offer.unit, gap.need)}</span>
          </p>
        ) : <span />}
        <Countdown endsAt={offer.ends_at} compact />
      </div>

      <div className="mt-5">
        {!isGuest && !hasAccess ? (
          <div className="w-full rounded-xl2 bg-white/5 border border-white/10 py-3.5 text-center text-sm text-muted">
            🔒 Это предложение доступно только для {scopeLabel(offer).replace(/^\S+\s/, '').toLowerCase()}
          </div>
        ) : joined ? (
          <div className="w-full rounded-xl2 bg-accent2/15 border border-accent2/40 py-3.5 text-center font-bold text-accent2">
            ✓ Вы участвуете
          </div>
        ) : (
          <button
            onClick={handleParticipate}
            disabled={pending}
            className="w-full rounded-xl2 bg-accent py-4 text-center text-lg font-extrabold text-white active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {pending ? 'Секунду…' : 'УЧАСТВОВАТЬ'}
          </button>
        )}
        {error && <p className="text-sm text-accent mt-2 text-center">{error}</p>}
      </div>
    </div>
  )
}
