import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/lib/types'
import LogoutButton from './LogoutButton'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/onboarding')

  return (
    <div className="px-4 pt-6 pb-10">
      <header className="flex items-center gap-3 mb-8">
        <Link href="/" className="text-xl">
          ←
        </Link>
        <h1 className="text-xl font-bold">Профиль</h1>
      </header>

      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-surface border border-white/10 flex items-center justify-center text-3xl mb-3">
          🙂
        </div>
        <h2 className="text-xl font-bold">{profile.name}</h2>
      </div>

      <div className="rounded-xl2 bg-surface border border-white/8 p-4 mb-4">
        <h3 className="text-sm text-muted mb-3">Мой адрес</h3>
        <p className="text-lg font-semibold leading-relaxed">
          {profile.city}
          <br />
          {profile.district && <>{profile.district} р-н{'\n'}</>}
          {profile.residential_complex && <>ЖК «{profile.residential_complex}»{'\n'}</>}
          ул. {profile.street}, дом {profile.building}
        </p>
        <Link
          href="/onboarding"
          className="inline-block mt-4 text-sm font-semibold text-accent2"
        >
          Изменить адрес →
        </Link>
      </div>

      {profile.role === 'admin' && (
        <Link
          href="/admin"
          className="block w-full text-center rounded-xl2 border border-white/15 py-3.5 font-bold mb-4"
        >
          ⚙️ Admin-панель
        </Link>
      )}

      <LogoutButton />
    </div>
  )
}
