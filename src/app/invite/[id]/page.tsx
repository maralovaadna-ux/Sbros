import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function InvitePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // после входа/регистрации отправим прямо на предложение
    redirect(`/login?redirect=/offer/${params.id}`)
  }

  redirect(`/offer/${params.id}`)
}
