// Fill in your Supabase project's URL and anon key (Project Settings > API).
// The anon key is meant to be public-safe, but schema.sql leaves RLS fully
// open for anon read/write, so don't put anything sensitive behind this.
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
