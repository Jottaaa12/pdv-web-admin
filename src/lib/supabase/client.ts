import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Cria um cliente supabase do lado do cliente (browser)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}