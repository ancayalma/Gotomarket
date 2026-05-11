// Supabase client for Grenoucerie Marketing Dashboard
// Credentials via environment variables (VITE_ prefix required for Vite)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || 'https://sfedzatwwqjukgijpgbo.supabase.co'
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = supabaseAnon
    ? createClient(supabaseUrl, supabaseAnon)
    : null

export const isConnected = !!supabaseAnon
