'use client'

import { useEffect, useState } from 'react'

const SESSION_KEY = 'sbros_splash_shown'
const SPLASH_DURATION_MS = 2000

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(SESSION_KEY)
    if (alreadyShown) return

    setVisible(true)
    sessionStorage.setItem(SESSION_KEY, '1')

    const fadeTimer = setTimeout(() => setFadingOut(true), SPLASH_DURATION_MS - 300)
    const hideTimer = setTimeout(() => setVisible(false), SPLASH_DURATION_MS)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink transition-opacity duration-300 ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-512.png" alt="СБРОС" className="w-28 h-28 rounded-3xl mb-6" />
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-accent2 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-accent2 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-accent2 animate-bounce" />
      </div>
    </div>
  )
}
