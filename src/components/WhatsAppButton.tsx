function normalizeForWaLink(phone: string): string {
  // wa.me требует только цифры, без + и пробелов
  return phone.replace(/\D/g, '')
}

export default function WhatsAppButton({ phone, offerTitle }: { phone: string; offerTitle: string }) {
  const digits = normalizeForWaLink(phone)
  const text = encodeURIComponent(`Здравствуйте! Пишу по поводу СБРОС «${offerTitle}»`)
  const href = `https://wa.me/${digits}?text=${text}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0"
      aria-label="Написать продавцу в WhatsApp"
    >
      <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38c1.44.79 3.06 1.2 4.71 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.91 6.45 17.5 2 12.04 2zm5.8 14.05c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.29.58-.36.77-.36.19 0 .39 0 .55.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.63-.14.26.1 1.64.77 1.92.91.29.15.48.22.55.34.07.13.07.75-.17 1.43z"/>
      </svg>
    </a>
  )
}
