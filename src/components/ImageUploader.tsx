'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('offer-images')
      .upload(path, file, { upsert: false })

    if (uploadError) {
      setError('Не получилось загрузить фото: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('offer-images').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <label className="text-sm text-muted mb-1.5 block">Фото</label>

      {value ? (
        <div className="relative mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Фото предложения" className="w-full h-40 object-cover rounded-xl2" />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-black/60 rounded-full w-8 h-8 flex items-center justify-center text-white"
          >
            ✕
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl2 bg-surface border border-dashed border-white/20 cursor-pointer mb-2">
          <span className="text-muted text-sm">{uploading ? 'Загрузка…' : '+ Загрузить фото'}</span>
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      )}

      {error && <p className="text-accent text-sm">{error}</p>}
    </div>
  )
}
