import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { ScanRequestSchema } from '../validators/schemas.js';
import { analyzeSecurityPayload } from '../services/geminiService.js';

const router = Router();

// In-memory fallback cache for development before database migration is applied
const localScansCache = [];

// POST /api/scans/analyze
router.post('/analyze', async (req, res, next) => {
  let createdScanId = null;
  try {
    const validatedData = ScanRequestSchema.parse(req.body);
    const userId = req.user.id;

    const defaultTitle = `${validatedData.domain.replace(/_/g, ' ')} Audit`;
    const title = validatedData.title || defaultTitle;

    // Attempt to persist initial placeholder in Supabase
    try {
      const { data: initialScan } = await supabaseAdmin
        .from('security_scans')
        .insert({
          user_id: userId,
          title,
          domain: validatedData.domain,
          compliance_framework: validatedData.complianceFramework,
          redaction_mode: validatedData.redactionMode,
          raw_input_preview: validatedData.content.substring(0, 1000),
          redacted_output: 'Analyzing security & privacy posture...',
          risk_score: 0,
          trust_score: 100,
          severity: 'LOW',
          pii_detected_count: 0,
          threats_detected_count: 0,
          analysis_report: {},
          status: 'generating',
        })
        .select()
        .maybeSingle();

      if (initialScan) createdScanId = initialScan.id;
    } catch (dbErr) {
      console.warn('[DB] Supabase security_scans table notice:', dbErr.message);
    }

    // Execute Gemini 3.5 / 3.8 analysis & DLP pre-scan
    const auditResult = await analyzeSecurityPayload({
      domain: validatedData.domain,
      complianceFramework: validatedData.complianceFramework,
      redactionMode: validatedData.redactionMode,
      content: validatedData.content,
    });

    const piiCount = auditResult.piiAndSecretsFound?.length || 0;
    const threatsCount = auditResult.threatsDetected?.length || 0;

    let finalScan = {
      id: createdScanId || `scan-${Date.now()}`,
      user_id: userId,
      title,
      domain: validatedData.domain,
      compliance_framework: validatedData.complianceFramework,
      redaction_mode: validatedData.redactionMode,
      raw_input_preview: validatedData.content.substring(0, 1000),
      redacted_output: auditResult.redactedOutput,
      risk_score: auditResult.riskScore,
      trust_score: auditResult.trustScore,
      severity: auditResult.severity,
      pii_detected_count: piiCount,
      threats_detected_count: threatsCount,
      analysis_report: auditResult,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    if (createdScanId) {
      try {
        const { data: updatedScan } = await supabaseAdmin
          .from('security_scans')
          .update({
            redacted_output: auditResult.redactedOutput,
            risk_score: auditResult.riskScore,
            trust_score: auditResult.trustScore,
            severity: auditResult.severity,
            pii_detected_count: piiCount,
            threats_detected_count: threatsCount,
            analysis_report: auditResult,
            status: 'completed',
          })
          .eq('id', createdScanId)
          .eq('user_id', userId)
          .select()
          .single();

        if (updatedScan) finalScan = updatedScan;
      } catch (updErr) {
        console.warn('[DB] Supabase scan update notice:', updErr.message);
      }
    } else {
      localScansCache.unshift(finalScan);
    }

    return res.status(200).json({ scan: finalScan });
  } catch (err) {
    if (createdScanId) {
      try {
        await supabaseAdmin
          .from('security_scans')
          .update({
            status: 'failed',
            redacted_output: `Audit execution failed: ${err.message}`,
          })
          .eq('id', createdScanId);
      } catch (e) {}
    }
    return next(err);
  }
});

// GET /api/scans
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { domain, severity } = req.query;

    try {
      let query = supabaseAdmin
        .from('security_scans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (domain) query = query.eq('domain', domain);
      if (severity) query = query.eq('severity', severity);

      const { data: scans, error } = await query;
      if (!error && scans) return res.json({ scans });
    } catch (dbErr) {
      console.warn('[DB] Supabase scans select fallback to local cache');
    }

    // Filter local fallback cache
    let filtered = localScansCache.filter((s) => s.user_id === userId);
    if (domain) filtered = filtered.filter((s) => s.domain === domain);
    if (severity) filtered = filtered.filter((s) => s.severity === severity);

    return res.json({ scans: filtered });
  } catch (err) {
    return next(err);
  }
});

// GET /api/scans/:id
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      const { data: scan, error } = await supabaseAdmin
        .from('security_scans')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!error && scan) return res.json({ scan });
    } catch (e) {}

    const local = localScansCache.find((s) => s.id === id && s.user_id === userId);
    if (local) return res.json({ scan: local });

    return res.status(404).json({ error: 'Scan not found or unauthorized.' });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/scans/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      await supabaseAdmin
        .from('security_scans')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    } catch (e) {}

    const idx = localScansCache.findIndex((s) => s.id === id && s.user_id === userId);
    if (idx !== -1) localScansCache.splice(idx, 1);

    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    return next(err);
  }
});

export default router;
