import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

function formatSupabaseUrl(rawUrl) {
  if (!rawUrl) return 'https://placeholder.supabase.co';
  const trimmed = rawUrl.trim();

  // If a JWT token was mistakenly pasted into SUPABASE_URL, extract the project ref
  if (trimmed.startsWith('eyJ')) {
    try {
      const parts = trimmed.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload?.ref) {
          console.log(`[SUPABASE_CONFIG] Auto-detected project ref from token: ${payload.ref}`);
          return `https://${payload.ref}.supabase.co`;
        }
      }
    } catch (e) {
      console.warn('[SUPABASE_CONFIG] Could not decode project ref from token:', e.message);
    }
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

const rawUrl = process.env.SUPABASE_URL || '';
const supabaseUrl = formatSupabaseUrl(rawUrl);
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-service-role-key';

if (!rawUrl || rawUrl.includes('placeholder')) {
  console.warn(
    '[WARN] SUPABASE_URL is not properly defined in backend environment.'
  );
}

// Service role client for server-side trusted operations (bypassing RLS when validating tokens or admin triggers)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Anon client for public operations
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
