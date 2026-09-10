import Link from 'next/link'
import { SCOPE_ICONS, SCOPE_LABELS } from '@/lib/types'
import type { OfferWithStats } from '@/lib/types'

export default function LockedOfferCard({ offer }: { offer: OfferWithStats }) {
  const icon = SCOPE_ICONS[offer.scope_type]
  const label = SCOPE_LABELS[offer.scope_type]

  return (
    <Link
      href="/welcome"
      className="block rounded-xl2 bg-surface/50 border border-white/8 border-dashed p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl shrink-0">
          🔒
        </div>
        <div>
          <p className="font-semibold text-white">
            {icon} Есть предложение для {label}
          </p>
          <p className="text-sm text-muted mt-0.5">Зарегистрируйтесь и укажите адрес, чтобы увидеть детали</p>
        </div>
      </div>
    </Link>
  )
}
