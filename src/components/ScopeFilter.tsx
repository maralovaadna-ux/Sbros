'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { ScopeType } from '@/lib/types'

const OPTIONS: { key: string; label: string }[] = [
  { key: 'for_me', label: 'Для меня' },
  { key: 'residential_complex', label: 'Мой ЖК' },
  { key: 'building', label: 'Мой дом' },
  { key: 'district', label: 'Мой район' },
  { key: 'city', label: 'Мой город' },
  { key: 'country', label: 'Казахстан' },
]

export default function ScopeFilter({ active }: { active: string }) {
  const router = useRouter()
  const params = useSearchParams()

  function select(key: string) {
    const sp = new URLSearchParams(params.toString())
    if (key === 'for_me') sp.delete('scope')
    else sp.set('scope', key)
    router.push(`/?${sp.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3 -mx-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => select(opt.key)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
            active === opt.key
              ? 'bg-white text-ink border-white'
              : 'bg-transparent text-muted border-white/15'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
