import { createClient } from '@supabase/supabase-js'

// These come from your Supabase project settings (Project Settings > API).
// No backend server needed — the frontend talks to Supabase directly.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
