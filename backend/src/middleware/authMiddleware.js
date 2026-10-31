import { supabaseAdmin } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or malformed Authorization header. Expected Bearer <token>.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token is empty.' });
    }

    // Verify token with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        error: 'Invalid or expired authentication token.',
        details: error?.message,
      });
    }

    const user = data.user;

    // Ensure user profile exists in public.profiles to satisfy Foreign Keys
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        // Auto-provision profile row if trigger hasn't completed yet
        await supabaseAdmin.from('profiles').upsert({
          id: user.id,
          email: user.email || 'user@sentineltrust.ai',
          full_name:
            user.user_metadata?.full_name ||
            (user.email ? user.email.split('@')[0] : 'Security Analyst'),
          organization:
            user.user_metadata?.organization || 'Enterprise Workspace',
          role: 'analyst',
        });
      }
    } catch (profileErr) {
      console.warn('[AUTH] Warning verifying profile existence:', profileErr.message);
    }

    req.user = {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata || {},
    };

    return next();
  } catch (err) {
    console.error('[AUTH_ERROR]', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

