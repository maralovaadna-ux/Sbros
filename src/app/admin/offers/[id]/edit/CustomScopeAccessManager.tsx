'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function CustomScopeAccessManager({
  offerId,
  allUsers,
  initialAccessUserIds,
}: {
  offerId: string
  allUsers: Profile[]
  initialAccessUserIds: string[]
}) {
  const supabase = createClient()
  const [accessIds, setAccessIds] = useState<Set<string>>(new Set(initialAccessUserIds))
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState<string | null>(null)

  async function toggle(userId: string) {
    setPending(userId)
    if (accessIds.has(userId)) {
      const { error } = await supabase
        .from('custom_scope_access')
        .delete()
        .eq('offer_id', offerId)
        .eq('user_id', userId)
      if (!error) {
        const next = new Set(accessIds)
        next.delete(userId)
        setAccessIds(next)
      }
    } else {
      const { error } = await supabase.from('custom_scope_access').insert({ offer_id: offerId, user_id: userId })
      if (!error) {
        const next = new Set(accessIds)
        next.add(userId)
        setAccessIds(next)
      }
    }
    setPending(null)
  }

  const filtered = allUsers.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по имени…"
        className="w-full rounded-xl2 bg-surface border border-white/10 px-4 py-2.5 text-sm outline-none mb-3"
      />
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {filtered.map((u) => {
          const has = accessIds.has(u.id)
          return (
            <button
              key={u.id}
              onClick={() => toggle(u.id)}
              disabled={pending === u.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border ${
                has ? 'bg-accent2/15 border-accent2/40 text-accent2' : 'bg-surface border-white/8 text-white'
              }`}
            >
              <span>{u.name}</span>
              <span>{has ? '✓ добавлен' : '+ добавить'}</span>
            </button>
          )
        })}
        {filtered.length === 0 && <p className="text-muted text-sm">Никого не найдено.</p>}
      </div>
    </div>
  )
}
