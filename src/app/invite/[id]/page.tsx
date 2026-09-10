import { redirect } from 'next/navigation'

export default async function InvitePage({ params }: { params: { id: string } }) {
  // Гость тоже может открыть предложение по ссылке — просто перенаправляем
  // на карточку. Регистрация всплывет сама, если он попробует участвовать/писать в чат.
  redirect(`/offer/${params.id}`)
}
