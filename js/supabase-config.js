// Fill in your Supabase project's URL and anon key (Project Settings > API).
// The anon key is meant to be public-safe, but schema.sql leaves RLS fully
// open for anon read/write, so don't put anything sensitive behind this.
const SUPABASE_URL = 'https://tpzauqtqvpmtgidhgtrc.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwemF1cXRxdnBtdGdpZGhndHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyOTg2NTQsImV4cCI6MjA5Nzg3NDY1NH0.vYpJGG7v6UaLjlcQ-cuAXxOLLaJpEACOSR7XWioo-Ok'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
