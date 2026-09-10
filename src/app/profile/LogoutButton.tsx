'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={logout}
      disabled={pending}
      className="w-full text-center rounded-xl2 border border-white/10 py-3.5 font-semibold text-muted disabled:opacity-60"
    >
      {pending ? 'Выходим…' : 'Выйти'}
    </button>
  )
}
