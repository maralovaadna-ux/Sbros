import type { PriceTier } from '@/lib/types'
import { formatTenge } from '@/lib/pricing'

export default function TieredProgressBar({
  percent,
  tiers,
  targetParticipants,
  currentCount,
}: {
  percent: number
  tiers: PriceTier[]
  targetParticipants: number
  currentCount: number
}) {
  const sortedTiers = [...tiers].sort((a, b) => a.min_participants - b.min_participants)

  return (
    <div className="pt-1 pb-2">
      <div className="relative h-2 w-full rounded-full bg-white/10 overflow-visible">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
        {sortedTiers.map((t) => {
          const pos = Math.min(100, (t.min_participants / targetParticipants) * 100)
          const reached = currentCount >= t.min_participants
          return (
            <div
              key={t.id}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${pos}%` }}
            >
              <div
                className={`w-3 h-3 rounded-full border-2 -translate-x-1/2 ${
                  reached ? 'bg-accent2 border-accent2' : 'bg-ink border-white/30'
                }`}
              />
            </div>
          )
        })}
      </div>

      <div className="relative mt-2 h-8">
        {sortedTiers.map((t) => {
          const pos = Math.min(100, (t.min_participants / targetParticipants) * 100)
          const reached = currentCount >= t.min_participants
          return (
            <div
              key={t.id}
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${pos}%` }}
            >
              <span className={`text-[10px] font-semibold whitespace-nowrap ${reached ? 'text-accent2' : 'text-muted'}`}>
                {t.min_participants}
              </span>
              <span className={`text-[10px] whitespace-nowrap ${reached ? 'text-white' : 'text-muted'}`}>
                {formatTenge(t.price)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
