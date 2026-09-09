'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function UserRow({ user }: { user: Profile }) {
  const supabase = createClient()
  const [isBlocked, setIsBlocked] = useState(user.is_blocked)
  const [pending, setPending] = useState(false)

  async function toggle() {
    setPending(true)
    const { error } = await supabase.from('profiles').update({ is_blocked: !isBlocked }).eq('id', user.id)
    if (!error) setIsBlocked(!isBlocked)
    setPending(false)
  }

  return (
    <div className="rounded-xl2 bg-surface border border-white/8 p-3 flex items-center justify-between">
      <div>
        <p className="font-semibold">{user.name}</p>
        <p className="text-xs text-muted">
          {user.city}
          {user.residential_complex ? `, ЖК ${user.residential_complex}` : ''}, ул. {user.street} {user.building}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={pending}
        className={`text-xs font-bold rounded-full px-3 py-1.5 shrink-0 ${
          isBlocked ? 'bg-white/10 text-muted' : 'bg-accent/15 text-accent'
        }`}
      >
        {isBlocked ? 'Разблокировать' : 'Заблокировать'}
      </button>
    </div>
  )
}
