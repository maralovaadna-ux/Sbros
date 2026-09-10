'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const MAX_PHOTOS = 3

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string[]
  onChange: (urls: string[]) => void
}) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (value.length >= MAX_PHOTOS) return
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
    onChange([...value, data.publicUrl])
    setUploading(false)
    e.target.value = ''
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="text-sm text-muted mb-1.5 block">
        Фото ({value.length}/{MAX_PHOTOS})
      </label>

      <div className="grid grid-cols-3 gap-2 mb-2">
        {value.map((url, i) => (
          <div key={url} className="relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Фото ${i + 1}`} className="w-full h-full object-cover rounded-xl2" />
            <button
              onClick={() => removeAt(i)}
              className="absolute top-1 right-1 bg-black/60 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs"
            >
              ✕
            </button>
          </div>
        ))}

        {value.length < MAX_PHOTOS && (
          <label className="flex flex-col items-center justify-center aspect-square rounded-xl2 bg-surface border border-dashed border-white/20 cursor-pointer">
            <span className="text-muted text-xs text-center px-1">
              {uploading ? 'Загрузка…' : '+ Фото'}
            </span>
            <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>

      {error && <p className="text-accent text-sm">{error}</p>}
    </div>
  )
}
