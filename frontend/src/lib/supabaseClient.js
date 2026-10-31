import { createClient } from '@supabase/supabase-js';

function formatSupabaseUrl(rawUrl) {
  if (!rawUrl) return 'https://placeholder.supabase.co';
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
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

const supabaseUrl = formatSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
