import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ScopeBadge from '@/components/ScopeBadge'
import ParticipateButton from '@/components/ParticipateButton'
import InviteButton from '@/components/InviteButton'
import Chat from '@/components/Chat'
import type { Message, Offer, PriceTier } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function OfferPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS: если у пользователя нет гео-доступа, этот select вернёт пусто (не 403 — просто не видно)
  const { data: offer } = await supabase
    .from('offers')
    .select('*')
    .eq('id', params.id)
    .maybeSingle<Offer>()

  if (!offer) notFound()

  const [{ data: tiers }, { count: participantsCount }, { data: myParticipation }, { data: messages }] =
    await Promise.all([
      supabase.from('price_tiers').select('*').eq('offer_id', offer.id).order('min_participants').returns<PriceTier[]>(),
      supabase.from('participations').select('id', { count: 'exact', head: true }).eq('offer_id', offer.id),
      supabase.from('participations').select('id').eq('offer_id', offer.id).eq('user_id', user.id).maybeSingle(),
      supabase
        .from('messages')
        .select('*, profiles:profiles!messages_user_id_fkey(id, name, avatar_url)')
        .eq('offer_id', offer.id)
        .eq('is_deleted', false)
        .order('created_at')
        .returns<Message[]>(),
    ])

  // hasAccess: если запрос выше вообще вернул offer, значит RLS уже подтвердил доступ на чтение.
  // Право УЧАСТВОВАТЬ проверяем той же функцией через RPC, чтобы кнопка была честной.
  const { data: hasAccess } = await supabase.rpc('can_user_access_offer', {
    p_user_id: user.id,
    p_offer_id: offer.id,
  })

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
        <ScopeBadge offer={offer} />
        <h1 className="text-2xl font-extrabold mt-2 mb-1">{offer.title}</h1>
        {offer.description && <p className="text-muted mb-4">{offer.description}</p>}

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
          userId={user.id}
          initialCount={participantsCount ?? 0}
          initiallyJoined={!!myParticipation}
          hasAccess={!!hasAccess}
        />

        <div className="mt-4">
          <InviteButton offer={offerWithStats} />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">💬 Чат — {offer.title}</h2>
          <Chat offerId={offer.id} userId={user.id} initialMessages={messages ?? []} />
        </div>
      </div>
    </div>
  )
}
