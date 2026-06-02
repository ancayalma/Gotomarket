import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || 'https://pnxtynapbusddgrzfhmw.supabase.co'
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBueHR5bmFwYnVzZGRncnpmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODIxNjQsImV4cCI6MjA5NDI1ODE2NH0.Rk7OzET5nOtBWGNIRlGFb-_mdnpKzAM8dWktXvgPH1k'

export const supabase = createClient(supabaseUrl, supabaseAnon)
export const isConnected = true
