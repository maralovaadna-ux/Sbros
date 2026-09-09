import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
  if (digits.startsWith('7') && digits.length === 11) return '+' + digits
  if (digits.length === 10) return '+7' + digits
  return '+' + digits
}

function deriveCredentials(phone: string) {
  const secret = process.env.AUTH_PHONE_SECRET
  if (!secret) throw new Error('AUTH_PHONE_SECRET is not set')
  const hash = crypto.createHmac('sha256', secret).update(phone).digest('hex')
  const email = `p${hash.slice(0, 32)}@sbros.local`
  const password = hash.slice(32, 64)
  return { email, password }
}

export async function POST(req: Request) {
  try {
    const { phone: rawPhone, name } = await req.json()
    if (!rawPhone || typeof rawPhone !== 'string') {
      return NextResponse.json({ error: 'Введите номер телефона' }, { status: 400 })
    }
    const phone = normalizePhone(rawPhone)
    if (phone.length < 11) {
      return NextResponse.json({ error: 'Некорректный номер телефона' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'DEBUG: missing env vars on server' }, { status: 500 })
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { email, password } = deriveCredentials(phone)

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: name ? { name } : undefined,
    })

    if (createErr) {
      if (!String(createErr.message).toLowerCase().includes('already')) {
        return NextResponse.json({ error: `DEBUG: ${createErr.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ email, password })
  } catch (e: any) {
    return NextResponse.json({ error: `DEBUG catch: ${e?.message ?? String(e)}` }, { status: 500 })
  }
}
