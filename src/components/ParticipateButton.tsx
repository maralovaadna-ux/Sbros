'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { currentPrice, nextTierGap, progressPercent, scopeLabel, unitCountLabel, unitLabel, formatTenge, isOfferFinished, manualSoldLabel } from '@/lib/pricing'
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
  const [showLockedPrompt, setShowLockedPrompt] = useState(false)
  const [showJoinedPrompt, setShowJoinedPrompt] = useState(false)

  const finished = isOfferFinished(offer)

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

  function participateAs(uid: string) {
    setError(null)
    startTransition(async () => {
      const { error: insertError } = await supabase
        .from('participations')
        .insert({ offer_id: offer.id, user_id: uid })
      if (insertError) {
        setError('Не получилось. Попробуйте ещё раз.')
        return
      }
      setJoined(true)
      setCount((c) => c + 1)
      setShowJoinedPrompt(true)
    })
  }

  function handleParticipate() {
    if (finished) return
    if (!isGuest && !hasAccess) {
      setShowLockedPrompt(true)
      return
    }
    if (isGuest || !userId) {
      setShowPrompt(true)
      return
    }
    participateAs(userId)
  }

  async function handleRegisterSuccess() {
    const { data } = await supabase.auth.getUser()
    if (data.user) participateAs(data.user.id)
  }

  const price = currentPrice(offer, offer.price_tiers, count)
  const gap = nextTierGap(offer.price_tiers, count)
  const pct = progressPercent(count, offer.target_participants)

  return (
    <div>
      <RegisterPromptModal open={showPrompt} onClose={() => setShowPrompt(false)} onSuccess={handleRegisterSuccess} />

      {showLockedPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          onClick={() => setShowLockedPrompt(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-xl2 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-bold text-lg mb-2">Только для своих</h3>
            <p className="text-muted text-sm mb-5">
              Это предложение доступно {scopeLabel(offer).replace(/^\S+\s/, '').toLowerCase()}
            </p>
            <button
              onClick={() => setShowLockedPrompt(false)}
              className="w-full rounded-xl2 bg-white/10 py-3 font-semibold"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {showJoinedPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          onClick={() => setShowJoinedPrompt(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-xl2 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-bold text-lg mb-2">Вы участвуете!</h3>
            <p className="text-muted text-sm mb-5">
              Мы напишем вам в WhatsApp для оплаты и договорённостей по доставке, когда СБРОС наберёт нужное количество участников.
            </p>
            <button
              onClick={() => setShowJoinedPrompt(false)}
              className="w-full rounded-xl2 bg-accent py-3 font-bold"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">
            {unitCountLabel(offer.unit, count)} / {unitCountLabel(offer.unit, offer.target_participants)}
          </span>
          {offer.manual_sold_count != null && (
            <span className="text-xs font-bold text-accent bg-accent/15 rounded-full px-2 py-0.5">
              {manualSoldLabel(offer)}
            </span>
          )}
        </div>
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
        {finished ? (
          <div className="w-full rounded-xl2 bg-white/5 border border-white/10 py-3.5 text-center font-bold text-muted">
            ⛔ СБРОС ЗАКОНЧЕН
          </div>
        ) : joined ? (
          <div className="w-full rounded-xl2 bg-accent2/15 border border-accent2/40 py-3.5 text-center font-bold text-accent2">
            ✓ Вы участвуете
          </div>
        ) : !isGuest && !hasAccess ? (
          <button
            onClick={() => setShowLockedPrompt(true)}
            className="w-full rounded-xl2 bg-white/5 border border-white/10 py-3.5 text-center text-sm font-semibold text-muted"
          >
            🔒 Доступно только для {scopeLabel(offer).replace(/^\S+\s/, '').toLowerCase()}
          </button>
        ) : (
          <button
            onClick={handleParticipate}
            disabled={pending}
            className="w-full rounded-xl2 bg-accent py-4 text-center text-lg font-extrabold text-white active:scale-[0.98] transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {pending && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {pending ? 'Секунду…' : 'УЧАСТВОВАТЬ'}
          </button>
        )}
        {error && <p className="text-sm text-accent mt-2 text-center">{error}</p>}
      </div>
    </div>
  )
}
