import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user scans
    const { data: scans, error: scansError } = await supabaseAdmin
      .from('security_scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (scansError) throw scansError;

    // Fetch user conversations
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (convError) throw convError;

    const userScans = scans || [];
    const userConvs = conversations || [];

    const totalScans = userScans.length;
    const totalConversations = userConvs.length;

    let totalPiiRedacted = 0;
    let sumTrust = 0;
    let sumRisk = 0;

    const severityMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

    for (const scan of userScans) {
      totalPiiRedacted += scan.pii_detected_count || 0;
      sumTrust += scan.trust_score || 0;
      sumRisk += scan.risk_score || 0;
      if (severityMap[scan.severity] !== undefined) {
        severityMap[scan.severity] += 1;
      }
    }

    const avgTrustScore =
      totalScans > 0 ? Math.round(sumTrust / totalScans) : 0;
    const avgRiskScore =
      totalScans > 0 ? Math.round(sumRisk / totalScans) : 0;

    const severityBreakdown = [
      { name: 'Low', severity: 'LOW', count: severityMap.LOW, color: '#10B981' },
      { name: 'Medium', severity: 'MEDIUM', count: severityMap.MEDIUM, color: '#F59E0B' },
      { name: 'High', severity: 'HIGH', count: severityMap.HIGH, color: '#F97316' },
      { name: 'Critical', severity: 'CRITICAL', count: severityMap.CRITICAL, color: '#EF4444' },
    ];

    // Compute trust trend from scans (ordered chronologically)
    const reversedScans = [...userScans].reverse();
    const trustTrend = reversedScans.map((s, idx) => ({
      index: idx + 1,
      date: new Date(s.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      trustScore: s.trust_score,
      riskScore: s.risk_score,
      title: s.title,
    }));

    // Recent items feed (scans + conversations merged)
    const recentItems = [
      ...userScans.slice(0, 5).map((s) => ({
        id: s.id,
        type: 'scan',
        title: s.title,
        domain: s.domain,
        severity: s.severity,
        riskScore: s.risk_score,
        trustScore: s.trust_score,
        createdAt: s.created_at,
      })),
      ...userConvs.slice(0, 5).map((c) => ({
        id: c.id,
        type: 'conversation',
        title: c.title,
        domain: c.domain,
        status: c.status,
        riskScore: c.last_risk_score,
        trustScore: c.last_trust_score,
        createdAt: c.created_at,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

    return res.json({
      totalConversations,
      totalScans,
      totalPiiRedacted,
      avgTrustScore,
      avgRiskScore,
      severityBreakdown,
      trustTrend,
      recentItems,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;

