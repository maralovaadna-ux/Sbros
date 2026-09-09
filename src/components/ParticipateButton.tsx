'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { currentPrice, nextTierGap, progressPercent, scopeLabel } from '@/lib/pricing'
import ProgressBar from './ProgressBar'
import type { OfferWithStats } from '@/lib/types'

export default function ParticipateButton({
  offer,
  userId,
  initialCount,
  initiallyJoined,
  hasAccess,
}: {
  offer: OfferWithStats
  userId: string
  initialCount: number
  initiallyJoined: boolean
  hasAccess: boolean
}) {
  const supabase = createClient()
  const [count, setCount] = useState(initialCount)
  const [joined, setJoined] = useState(initiallyJoined)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`offer-${offer.id}-participations`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participations', filter: `offer_id=eq.${offer.id}` },
        () => {
          // при любом изменении просто перезапрашиваем точный count через head-запрос
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold">
          {count} / {offer.target_participants} участников
        </span>
        <span className="text-sm text-muted">{pct}%</span>
      </div>
      <ProgressBar percent={pct} />
      {gap && (
        <p className="text-sm text-muted mt-2">
          До цены {new Intl.NumberFormat('ru-RU').format(gap.nextPrice)} ₸ осталось{' '}
          <span className="text-white font-semibold">{gap.need} человек</span>
        </p>
      )}

      <div className="mt-5">
        {!hasAccess ? (
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
