import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://fxrhnliyrlydvqyowjtj.supabase.co'
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cmhubGl5cmx5ZHZxeW93anRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzU0NzIsImV4cCI6MjA5NTMxMTQ3Mn0.EddkvsAPJW3pbDJS60rrL8Ir0vdgQWMc1V3wA-PBQD0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
