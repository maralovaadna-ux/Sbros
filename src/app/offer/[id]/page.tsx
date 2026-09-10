import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ScopeBadge from '@/components/ScopeBadge'
import ParticipateButton from '@/components/ParticipateButton'
import InviteButton from '@/components/InviteButton'
import Chat from '@/components/Chat'
import Countdown from '@/components/Countdown'
import { formatDateTime } from '@/lib/pricing'
import type { Message, Offer, PriceTier } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function OfferPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // RLS теперь открыт для всех (в т.ч. гостей) — если предложения нет вообще, будет notFound.
  const { data: offer } = await supabase
    .from('offers')
    .select('*')
    .eq('id', params.id)
    .maybeSingle<Offer>()

  if (!offer) notFound()

  const [{ data: tiers }, { count: participantsCount }, { data: messages }] = await Promise.all([
    supabase.from('price_tiers').select('*').eq('offer_id', offer.id).order('min_participants').returns<PriceTier[]>(),
    supabase.from('participations').select('id', { count: 'exact', head: true }).eq('offer_id', offer.id),
    supabase
      .from('messages')
      .select('*, profiles:profiles!messages_user_id_fkey(id, name, avatar_url)')
      .eq('offer_id', offer.id)
      .eq('is_deleted', false)
      .order('created_at')
      .returns<Message[]>(),
  ])

  let hasAccess = false
  let alreadyJoined = false

  if (user) {
    const [{ data: access }, { data: myParticipation }] = await Promise.all([
      supabase.rpc('can_user_access_offer', { p_user_id: user.id, p_offer_id: offer.id }),
      supabase.from('participations').select('id').eq('offer_id', offer.id).eq('user_id', user.id).maybeSingle(),
    ])
    hasAccess = !!access
    alreadyJoined = !!myParticipation
  }

  const offerWithStats = {
    ...offer,
    price_tiers: tiers ?? [],
    stats: {
      offer_id: offer.id,
      participants_count: participantsCount ?? 0,
      current_price: offer.base_price,
    },
  }

  return (
    <div className="pb-10">
      <header className="px-4 pt-5 pb-3 flex items-center gap-3">
        <Link href="/" className="text-xl">
          ←
        </Link>
        <span className="text-sm text-muted">Назад</span>
      </header>

      {offer.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={offer.image_url} alt={offer.title} className="w-full h-48 object-cover" />
      )}

      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <ScopeBadge offer={offer} />
          <Countdown endsAt={offer.ends_at} />
        </div>
        <p className="text-xs text-muted mb-1">СБРОС #{offer.offer_number}</p>
        <h1 className="text-2xl font-extrabold mb-1">{offer.title}</h1>
        {offer.description && <p className="text-muted mb-2">{offer.description}</p>}
        <p className="text-xs text-muted mb-4">Завершится: {formatDateTime(offer.ends_at)}</p>

        <div className="flex items-baseline gap-2 mb-5">
          <span className="text-muted line-through text-lg">
            {new Intl.NumberFormat('ru-RU').format(offer.base_price)} ₸
          </span>
          <span className="text-3xl font-extrabold text-accent2">
            {new Intl.NumberFormat('ru-RU').format(offer.target_price)} ₸
          </span>
        </div>

        <ParticipateButton
          offer={offerWithStats}
          userId={user?.id ?? null}
          initialCount={participantsCount ?? 0}
          initiallyJoined={alreadyJoined}
          hasAccess={hasAccess}
          isGuest={!user}
        />

        <div className="mt-4">
          <InviteButton offer={offerWithStats} />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">💬 Чат — {offer.title}</h2>
          <Chat offerId={offer.id} userId={user?.id ?? null} initialMessages={messages ?? []} isGuest={!user} />
        </div>
      </div>
    </div>
  )
}
