import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/lib/types'
import UserRow from './UserRow'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Profile[]>()

  return (
    <div className="px-4 pt-6 pb-16">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-xl">
          ←
        </Link>
        <h1 className="text-xl font-bold">Пользователи</h1>
      </header>

      <div className="flex flex-col gap-2">
        {(users ?? []).map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
      </div>
    </div>
  )
}
