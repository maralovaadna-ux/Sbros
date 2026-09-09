import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'СБРОС',
  description: 'Чем больше вас — тем ниже цена',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0B0B0F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-ink text-white">
        <div className="mx-auto max-w-[480px] min-h-screen bg-ink relative">{children}</div>
      </body>
    </html>
  )
}
