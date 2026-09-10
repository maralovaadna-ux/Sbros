import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import OfferForm from '@/components/OfferForm'
import type { Offer, PriceTier, Profile } from '@/lib/types'
import AdminChatModeration from './AdminChatModeration'
import CustomScopeAccessManager from './CustomScopeAccessManager'

export const dynamic = 'force-dynamic'

export default async function EditOfferPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: offer } = await supabase.from('offers').select('*').eq('id', params.id).single<Offer>()
  if (!offer) notFound()

  const [{ data: tiers }, { data: participants }, { data: messages }, { data: allUsers }, { data: customAccess }] =
    await Promise.all([
      supabase.from('price_tiers').select('*').eq('offer_id', offer.id).order('min_participants').returns<PriceTier[]>(),
      supabase
        .from('participations')
        .select('id, created_at, profiles(id, name)')
        .eq('offer_id', offer.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('messages')
        .select('*, profiles(id, name)')
        .eq('offer_id', offer.id)
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('name').returns<Profile[]>(),
      supabase.from('custom_scope_access').select('user_id').eq('offer_id', offer.id),
    ])

  return (
    <div className="px-4 pt-6 pb-16">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-xl">
          ←
        </Link>
        <h1 className="text-xl font-bold">Редактировать</h1>
      </header>

      <OfferForm existing={offer} existingTiers={tiers ?? []} />

      {offer.scope_type === 'custom' && (
        <div className="mt-10">
          <h2 className="font-bold mb-3">✨ Кому доступно это предложение</h2>
          <CustomScopeAccessManager
            offerId={offer.id}
            allUsers={allUsers ?? []}
            initialAccessUserIds={(customAccess ?? []).map((a) => a.user_id)}
          />
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-bold mb-3">👥 Участники ({participants?.length ?? 0})</h2>
        <div className="flex flex-col gap-2">
          {(participants ?? []).map((p: any) => (
            <div key={p.id} className="rounded-lg bg-surface border border-white/8 px-3 py-2 text-sm">
              {p.profiles?.name ?? 'Пользователь'}
            </div>
          ))}
          {(participants ?? []).length === 0 && <p className="text-muted text-sm">Пока никто не участвует.</p>}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-bold mb-3">💬 Модерация чата</h2>
        <AdminChatModeration messages={(messages ?? []) as any} />
      </div>
    </div>
  )
}
