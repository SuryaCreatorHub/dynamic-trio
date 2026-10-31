import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// Public registration endpoint that automatically marks the email as confirmed
// This eliminates the "Email not confirmed" block on new accounts
router.post('/register-direct', async (req, res) => {
  try {
    const { email, password, fullName, organization } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'Security Analyst',
        organization: organization || 'Enterprise Workspace',
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Auto-provision profile row in profiles table if it exists
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName || 'Security Analyst',
        organization: organization || 'Enterprise Workspace',
        role: 'analyst',
      });
    } catch (e) {}

    return res.status(201).json({
      ok: true,
      user: data.user,
      message: 'User created and auto-confirmed successfully.',
    });
  } catch (err) {
    console.error('[AUTH_REGISTER_ERROR]', err);
    return res.status(500).json({ error: err.message || 'Internal server error during registration.' });
  }
});

export default router;
