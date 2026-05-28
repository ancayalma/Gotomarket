import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || 'https://iveyofwlpqtohxvxvvrp.supabase.co'
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ2OTc5MjAwLCJleHAiOjE5MDQ3NDU2MDB9.55BMehE0MJ1XOz2Q3N_M1xCOml9IG_gqlMLWA0a4VYU'

export const supabase = createClient(supabaseUrl, supabaseAnon)
export const isConnected = true
