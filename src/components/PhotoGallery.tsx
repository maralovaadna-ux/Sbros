'use client'

import { useState } from 'react'

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
  if (urls.length === 0) return null

  return (
    <div className={`relative ${className ?? ''}`}>
      <div className={`w-full ${heightClass} bg-black flex items-center justify-center overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[index]} alt="Фото предложения" className="w-full h-full object-contain" />
      </div>

      {urls.length > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
          {index > 0 && (
            <button
              onClick={() => setIndex(index - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              ‹
            </button>
          )}
          {index < urls.length - 1 && (
            <button
              onClick={() => setIndex(index + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              ›
            </button>
          )}
        </>
      )}
    </div>
  )
}
