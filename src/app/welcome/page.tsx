'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const SLIDES = [
  {
    icon: '🔥',
    title: 'Чем больше вас — тем ниже цена',
    text: 'СБРОС объединяет соседей и знакомых, которые хотят купить одно и то же. Чем больше людей участвует — тем дешевле для всех.',
  },
  {
    icon: '📤',
    title: 'Приглашайте — цена падает',
    text: 'Нашли выгодный СБРОС? Поделитесь с друзьями и соседями — как только наберётся нужное число участников, цена снизится для всех сразу.',
  },
  {
    icon: '📲',
    title: 'Установите СБРОС на главный экран',
    text: 'Так удобнее — открывается как обычное приложение, без браузера.\n\nВ Chrome: нажмите ⋮ (три точки) → «Добавить на главный экран».\nВ Safari (iPhone): нажмите значок «Поделиться» → «На экран Домой».',
  },
]

function WelcomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const slide = SLIDES[step]
  const isLast = step === SLIDES.length - 1

  const redirectTo = searchParams.get('redirect')
  const loginUrl = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'

  function next() {
    if (isLast) {
      document.cookie = 'sbros_welcome_seen=1; path=/; max-age=31536000'
      router.push(loginUrl)
    } else {
      setStep(step + 1)
    }
  }

  function skip() {
    document.cookie = 'sbros_welcome_seen=1; path=/; max-age=31536000'
    router.push(loginUrl)
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-10">
      <div className="flex justify-end mb-4">
        {!isLast && (
          <button onClick={skip} className="text-sm text-muted">
            Пропустить
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-6">{slide.icon}</div>
        <h1 className="text-2xl font-extrabold mb-3">{slide.title}</h1>
        <p className="text-muted whitespace-pre-line leading-relaxed">{slide.text}</p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? 'w-6 bg-accent' : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>

      <button
        onClick={next}
        className="w-full rounded-xl2 bg-accent py-4 text-lg font-extrabold"
      >
        {isLast ? 'НАЧАТЬ' : 'ДАЛЬШЕ'}
      </button>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <WelcomeContent />
    </Suspense>
  )
}
