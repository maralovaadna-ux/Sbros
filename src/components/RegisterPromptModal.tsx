'use client'

import { useRouter } from 'next/navigation'

export default function RegisterPromptModal({
  open,
  onClose,
  text,
}: {
  open: boolean
  onClose: () => void
  text: string
}) {
  const router = useRouter()
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-surface rounded-t-2xl p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
        <h2 className="text-xl font-bold mb-2 text-center">Нужна регистрация</h2>
        <p className="text-muted text-center mb-6">{text}</p>
        <button
          onClick={() => router.push('/welcome')}
          className="w-full rounded-xl2 bg-accent py-4 text-lg font-extrabold mb-3"
        >
          ЗАРЕГИСТРИРОВАТЬСЯ
        </button>
        <button onClick={onClose} className="w-full text-center text-muted py-2">
          Не сейчас
        </button>
      </div>
    </div>
  )
}
