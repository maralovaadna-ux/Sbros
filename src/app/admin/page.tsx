import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Offer } from '@/lib/types'
import { scopeLabel, formatTenge } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Offer[]>()

  const offerIds = (offers ?? []).map((o) => o.id)
  const { data: stats } = await supabase.from('offer_stats').select('*').in('offer_id', offerIds)
  const statsByOffer = new Map((stats ?? []).map((s) => [s.offer_id, s]))

  return (
    <div className="px-4 pt-6 pb-10">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-xl">
            ←
          </Link>
          <h1 className="text-xl font-bold">Admin — Предложения</h1>
        </div>
        <Link
          href="/admin/offers/new"
          className="rounded-full bg-accent px-4 py-2 text-sm font-bold"
        >
          + Новое
        </Link>
      </header>

      <Link href="/admin/users" className="block text-sm text-accent2 font-semibold mb-6">
        👥 Управление пользователями →
      </Link>

      <div className="flex flex-col gap-3">
        {(offers ?? []).map((o) => {
          const s = statsByOffer.get(o.id)
          return (
            <Link
              key={o.id}
              href={`/admin/offers/${o.id}/edit`}
              className="rounded-xl2 bg-surface border border-white/8 p-4 block"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold">#{o.offer_number} {o.title}</h3>
                {!o.is_active && (
                  <span className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-muted">выкл</span>
                )}
              </div>
              <p className="text-xs text-muted mb-2">{scopeLabel(o)}</p>
              <div className="flex items-center justify-between text-sm">
                <span>{s?.participants_count ?? 0} / {o.target_participants} участников</span>
                <span className="font-semibold text-accent2">{formatTenge(s?.current_price ?? o.base_price)}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
