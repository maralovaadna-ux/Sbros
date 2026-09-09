export type ScopeType = 'building' | 'residential_complex' | 'district' | 'city' | 'country'

export type Profile = {
  id: string
  name: string
  avatar_url: string | null
  role: 'user' | 'admin'
  is_blocked: boolean
  country: string
  city: string
  district: string | null
  residential_complex: string | null
  street: string
  building: string
}

export type PriceTier = {
  id: string
  offer_id: string
  min_participants: number
  price: number
}

export type Offer = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  base_price: number
  target_price: number
  target_participants: number
  ends_at: string
  scope_type: ScopeType
  country: string
  city: string | null
  district: string | null
  residential_complex: string | null
  building: string | null
  street: string | null
  is_active: boolean
  created_at: string
}

export type OfferStats = {
  offer_id: string
  participants_count: number
  current_price: number
}

export type OfferWithStats = Offer & { stats: OfferStats; price_tiers: PriceTier[] }

export type Message = {
  id: string
  offer_id: string
  user_id: string
  content: string
  is_deleted: boolean
  created_at: string
  profiles?: Pick<Profile, 'id' | 'name' | 'avatar_url'>
}

export const SCOPE_LABELS: Record<ScopeType, string> = {
  building: 'дома',
  residential_complex: 'ЖК',
  district: 'района',
  city: 'города',
  country: 'Казахстана',
}

export const SCOPE_ICONS: Record<ScopeType, string> = {
  building: '🏘',
  residential_complex: '🏠',
  district: '📍',
  city: '🌆',
  country: '🇰🇿',
}

// приоритет сортировки: чем меньше число — тем локальнее и выше в ленте
export const SCOPE_PRIORITY: Record<ScopeType, number> = {
  building: 0,
  residential_complex: 1,
  district: 2,
  city: 3,
  country: 4,
}
