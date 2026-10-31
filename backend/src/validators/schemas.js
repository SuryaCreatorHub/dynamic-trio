import { z } from 'zod';

export const DomainEnum = z.enum([
  'PROMPT_SECURITY',
  'PII_PRIVACY_SHIELD',
  'PHISHING_FRAUD',
  'AI_TRUST_GOVERNANCE',
  'CODE_VULNERABILITY',
  'COMPLIANCE_AUDIT',
]);

export const ComplianceFrameworkEnum = z.enum([
  'DPDP_INDIA',
  'GDPR_EU',
  'OWASP_LLM_TOP_10',
  'NIST_AI_RMF',
  'SOC2_ISO27001',
]);

export const RedactionModeEnum = z.enum([
  'STRICT_MASK',
  'SYNTHETIC_REPLACE',
  'AUDIT_ONLY',
]);

export const ScanRequestSchema = z.object({
  title: z.string().trim().max(120).optional(),
  domain: DomainEnum.default('PROMPT_SECURITY'),
  complianceFramework: ComplianceFrameworkEnum.default('DPDP_INDIA'),
  redactionMode: RedactionModeEnum.default('STRICT_MASK'),
  content: z
    .string()
    .trim()
    .min(10, 'Payload must be at least 10 characters long.')
    .max(15000, 'Payload cannot exceed 15,000 characters.'),
});

export const ScanResultZodSchema = z.object({
  riskScore: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  executiveSummary: z.string(),
  redactedOutput: z.string(),
  threatsDetected: z.array(
    z.object({
      category: z.string(),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      evidence: z.string(),
      mitigation: z.string(),
    })
  ),
  piiAndSecretsFound: z.array(
    z.object({
      entityType: z.string(),
      originalHint: z.string(),
      replacementToken: z.string(),
      riskReason: z.string(),
    })
  ),
  trustAndExplainability: z.object({
    transparencyScore: z.number().min(0).max(100),
    biasAndFairnessAssessment: z.string(),
    hallucinationRisk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    explainabilityNotes: z.array(z.string()),
  }),
  complianceAssessment: z.object({
    framework: z.string(),
    status: z.enum(['COMPLIANT', 'PARTIAL_RISK', 'NON_COMPLIANT']),
    gapsIdentified: z.array(z.string()),
    remediationChecklist: z.array(z.string()),
  }),
});

export const CreateConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  domain: DomainEnum.default('PROMPT_SECURITY'),
});

export const SendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(10000),
  domain: DomainEnum.optional(),
});

export const CopilotResponseSchema = z.object({
  replyMarkdown: z.string(),
  riskScore: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  detectedFlags: z.array(z.string()),
  suggestedFollowUps: z.array(z.string()),
});

