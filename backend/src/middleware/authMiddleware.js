import { supabaseAdmin } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // In local development, if no Bearer token is provided, allow a default security analyst session
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'analyst@sentineltrust.ai',
          metadata: {
            full_name: 'Lead Security Analyst',
            organization: 'Enterprise SecOps',
          },
        };
        return next();
      }
      return res.status(401).json({
        error: 'Missing or malformed Authorization header. Expected Bearer <token>.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'analyst@sentineltrust.ai',
          metadata: { full_name: 'Lead Security Analyst' },
        };
        return next();
      }
      return res.status(401).json({ error: 'Token is empty.' });
    }

    // Verify token with Supabase Auth
    let user = null;
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    } catch (tokenErr) {
      console.warn('[AUTH] Supabase token verification error:', tokenErr.message);
    }

    // If token verification failed in dev, fallback to dev user
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'analyst@sentineltrust.ai',
          metadata: { full_name: 'Lead Security Analyst' },
        };
        return next();
      }
      return res.status(401).json({
        error: 'Invalid or expired authentication token.',
      });
    }

    // Ensure user profile exists in public.profiles if table exists
    try {
      const { data: profile, error: profErr } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profErr && !profile) {
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
      // Table may not be created yet in Supabase
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
