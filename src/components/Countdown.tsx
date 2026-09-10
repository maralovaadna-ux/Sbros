'use client'

import { useEffect, useState } from 'react'
import { timeLeft } from '@/lib/pricing'

export default function Countdown({ endsAt, compact }: { endsAt: string; compact?: boolean }) {
  const [text, setText] = useState(() => timeLeft(endsAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setText(timeLeft(endsAt))
    }, 30000) // обновляем раз в 30 сек — минутная точность не требует чаще
    return () => clearInterval(interval)
  }, [endsAt])

  if (text.expired) {
    return <span className={compact ? 'text-xs text-muted' : 'text-sm text-muted'}>⏱ Завершено</span>
  }

  return (
    <span className={compact ? 'text-xs text-accent2' : 'text-sm font-semibold text-accent2'}>
      ⏱ Осталось: {text.text}
    </span>
  )
}
