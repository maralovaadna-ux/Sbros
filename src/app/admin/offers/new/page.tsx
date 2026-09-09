import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OfferForm from '@/components/OfferForm'

export default async function NewOfferPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="px-4 pt-6 pb-16">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-xl">
          ←
        </Link>
        <h1 className="text-xl font-bold">Новое предложение</h1>
      </header>
      <OfferForm />
    </div>
  )
}
