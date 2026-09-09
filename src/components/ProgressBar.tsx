export default function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
