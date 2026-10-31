import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://jaqdsiipzvokwgdlkvij.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcWRzaWlwenZva3dnZGxrdmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MjQzOTUsImV4cCI6MjEwOTAwMDM5NX0.fvV48xYM7Gluf-xbXS-eF84GQ0umUG-npJShk7ZOOUk';

function formatSupabaseUrl(rawUrl) {
  if (!rawUrl || rawUrl.includes('placeholder')) {
    return DEFAULT_SUPABASE_URL;
  }
  const trimmed = rawUrl.trim();

  // If a JWT token was mistakenly pasted into VITE_SUPABASE_URL, extract the project ref
  if (trimmed.startsWith('eyJ')) {
    try {
      const parts = trimmed.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload?.ref) {
          return `https://${payload.ref}.supabase.co`;
        }
      }
    } catch (e) {
      console.warn('[SUPABASE_CLIENT] Could not decode project ref from token:', e.message);
    }
    return DEFAULT_SUPABASE_URL;
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL;
const rawEnvKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = formatSupabaseUrl(rawEnvUrl);
const supabaseAnonKey =
  rawEnvKey && !rawEnvKey.includes('placeholder')
    ? rawEnvKey
    : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
