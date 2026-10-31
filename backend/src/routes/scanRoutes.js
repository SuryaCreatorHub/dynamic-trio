import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { ScanRequestSchema } from '../validators/schemas.js';
import { analyzeSecurityPayload } from '../services/geminiService.js';

const router = Router();

// POST /api/scans/analyze
router.post('/analyze', async (req, res, next) => {
  let createdScanId = null;
  try {
    const validatedData = ScanRequestSchema.parse(req.body);
    const userId = req.user.id;

    const defaultTitle = `${validatedData.domain.replace(/_/g, ' ')} Audit`;
    const title = validatedData.title || defaultTitle;

    // Create initial placeholder record in 'generating' state for real-time status tracking
    const { data: initialScan, error: insertInitErr } = await supabaseAdmin
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
      .single();

    if (insertInitErr) throw insertInitErr;
    createdScanId = initialScan.id;

    // Execute Gemini analysis & DLP pre-scan
    const auditResult = await analyzeSecurityPayload({
      domain: validatedData.domain,
      complianceFramework: validatedData.complianceFramework,
      redactionMode: validatedData.redactionMode,
      content: validatedData.content,
    });

    const piiCount = auditResult.piiAndSecretsFound?.length || 0;
    const threatsCount = auditResult.threatsDetected?.length || 0;

    // Update scan with completed analysis
    const { data: updatedScan, error: updateErr } = await supabaseAdmin
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

    if (updateErr) throw updateErr;

    return res.status(200).json({ scan: updatedScan });
  } catch (err) {
    if (createdScanId) {
      await supabaseAdmin
        .from('security_scans')
        .update({
          status: 'failed',
          redacted_output: `Audit execution failed: ${err.message}`,
        })
        .eq('id', createdScanId);
    }
    return next(err);
  }
});

// GET /api/scans
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { domain, severity } = req.query;

    let query = supabaseAdmin
      .from('security_scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (domain) {
      query = query.eq('domain', domain);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: scans, error } = await query;
    if (error) throw error;

    return res.json({ scans: scans || [] });
  } catch (err) {
    return next(err);
  }
});

// GET /api/scans/:id
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: scan, error } = await supabaseAdmin
      .from('security_scans')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !scan) {
      return res.status(404).json({ error: 'Scan not found or unauthorized.' });
    }

    return res.json({ scan });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/scans/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('security_scans')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    return next(err);
  }
});

export default router;

