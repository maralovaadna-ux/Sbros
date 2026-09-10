import { scopeLabel } from '@/lib/pricing'
import type { Offer } from '@/lib/types'

export default function ScopeBadge({ offer }: { offer: Pick<Offer, 'scope_type' | 'city' | 'district' | 'residential_complex' | 'street' | 'building' | 'custom_scope_label'> }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-muted">
      {scopeLabel(offer)}
    </span>
  )
}
