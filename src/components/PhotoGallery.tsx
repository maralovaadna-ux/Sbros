'use client'

import { useRef, useState } from 'react'

const SWIPE_THRESHOLD = 50 // px — минимальное расстояние свайпа, чтобы засчитать переключение

export default function PhotoGallery({
  urls,
  className,
  heightClass,
}: {
  urls: string[]
  className?: string
  heightClass: string
}) {
  const [index, setIndex] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  if (urls.length === 0) return null

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0 && index < urls.length - 1) setIndex(index + 1) // свайп влево — следующее фото
      if (deltaX > 0 && index > 0) setIndex(index - 1) // свайп вправо — предыдущее фото
    }
    touchStartX.current = null
  }

  return (
    <>
      <div className={`relative ${className ?? ''}`}>
        <button
          onClick={() => setFullscreen(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`w-full ${heightClass} bg-black flex items-center justify-center overflow-hidden`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[index]} alt="Фото предложения" className="w-full h-full object-contain" />
        </button>

        {urls.length > 1 && (
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5 pointer-events-none">
            {urls.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setFullscreen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setFullscreen(false)
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-xl z-10"
          >
            ✕
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[index]} alt="Фото предложения" className="max-w-full max-h-full object-contain" />

          {urls.length > 1 && (
            <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-1.5">
              {urls.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
