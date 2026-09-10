import { createClient } from '@/lib/supabase/server'
import OfferCard from '@/components/OfferCard'
import ScopeFilter from '@/components/ScopeFilter'
import type { Offer, OfferWithStats, PriceTier, Profile, ScopeType } from '@/lib/types'
import { SCOPE_PRIORITY } from '@/lib/types'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage({
  searchParams,
}: {
  searchParams: { scope?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>()
    profile = data
    if (profile && (!profile.street || !profile.building)) {
      const { redirect } = await import('next/navigation')
      redirect('/onboarding')
    }
  }

  // RLS открывает select всем (гостям тоже). Полная карточка видна всем —
  // ограничение доступа (замок) применяется только на уровне кнопки "Участвовать"
  // на странице самого предложения, не в ленте.
  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .returns<Offer[]>()

  const offerIds = (offers ?? []).map((o) => o.id)

  const [{ data: tiers }, statsRows] = await Promise.all([
    supabase.from('price_tiers').select('*').in('offer_id', offerIds).returns<PriceTier[]>(),
    supabase.from('offer_stats').select('*').in('offer_id', offerIds),
  ])

  const tiersByOffer = new Map<string, PriceTier[]>()
  for (const t of tiers ?? []) {
    tiersByOffer.set(t.offer_id, [...(tiersByOffer.get(t.offer_id) ?? []), t])
  }
  const statsByOffer = new Map((statsRows.data ?? []).map((s) => [s.offer_id, s]))

  let enriched: OfferWithStats[] = (offers ?? []).map((o) => ({
    ...o,
    price_tiers: tiersByOffer.get(o.id) ?? [],
    stats: statsByOffer.get(o.id) ?? { offer_id: o.id, participants_count: 0, current_price: o.base_price },
  }))

  const scopeFilter = searchParams.scope as ScopeType | undefined
  if (scopeFilter) {
    enriched = enriched.filter((o) => o.scope_type === scopeFilter)
  }

  enriched.sort((a, b) => SCOPE_PRIORITY[a.scope_type] - SCOPE_PRIORITY[b.scope_type])

  const activeFilterKey = scopeFilter ?? 'for_me'

  return (
    <div className="pb-24">
      <header className="px-4 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">СБРОС</h1>
          <p className="text-muted text-sm">
            {profile ? (
              <>📍 {profile.city}{profile.district ? `, ${profile.district}` : ''}</>
            ) : (
              'Смотрите предложения без регистрации'
            )}
          </p>
        </div>
        <Link
          href={profile ? '/profile' : '/welcome'}
          className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center"
        >
          🙂
        </Link>
      </header>

      <ScopeFilter active={activeFilterKey} />

      <div className="flex flex-col gap-3 px-4">
        {enriched.length === 0 && (
          <p className="text-center text-muted py-16">Пока нет предложений для вас. Загляните позже.</p>
        )}
        {enriched.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  )
}
