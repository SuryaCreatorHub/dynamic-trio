/**
 * SentinelTrust AI — Deterministic DLP Pre-Scanner
 * Server-side static pattern matcher for high-entropy secrets, PII, and credentials.
 */

const DLP_PATTERNS = [
  {
    type: 'AWS_ACCESS_KEY',
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    token: '[REDACTED_AWS_ACCESS_KEY]',
    synthetic: 'AKIAIOSFODNN7EXAMPLE',
    reason: 'Exposes active AWS IAM access key ID.',
  },
  {
    type: 'AWS_SECRET_KEY',
    regex: /(?:AWS_SECRET_ACCESS_KEY|aws_secret_key)\s*[:=]\s*([A-Za-z0-9\/+=]{40})/gi,
    token: '[REDACTED_AWS_SECRET_KEY]',
    synthetic: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    reason: 'Exposes high-privilege AWS secret access key.',
  },
  {
    type: 'OPENAI_API_KEY',
    regex: /\b(sk-[A-Za-z0-9_-]{24,})\b/g,
    token: '[REDACTED_OPENAI_KEY]',
    synthetic: '[SYNTHETIC_OPENAI_KEY]',
    reason: 'Exposes LLM API key allowing unauthorized API usage and bill abuse.',
  },
  {
    type: 'GOOGLE_API_KEY',
    regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g,
    token: '[REDACTED_GOOGLE_API_KEY]',
    synthetic: '[SYNTHETIC_GOOGLE_KEY]',
    reason: 'Exposes Google Cloud / Gemini API key.',
  },
  {
    type: 'STRIPE_SECRET_KEY',
    regex: /\b((?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,})\b/g,
    token: '[REDACTED_STRIPE_KEY]',
    synthetic: '[SYNTHETIC_STRIPE_KEY]',
    reason: 'Exposes Stripe payment processing credential.',
  },
  {
    type: 'JWT_TOKEN',
    regex: /\b(ey[A-Za-z0-9_-]{10,}\.ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g,
    token: '[REDACTED_JWT]',
    synthetic: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummySignature',
    reason: 'Exposes JSON Web Token with potential user session hijacking risk.',
  },
  {
    type: 'INDIAN_PAN',
    regex: /\b([A-Z]{5}[0-9]{4}[A-Z])\b/g,
    token: '[REDACTED_PAN_CARD]',
    synthetic: 'ABCDE1234F',
    reason: 'Exposes Indian Permanent Account Number (statutory financial PII under DPDP Act).',
  },
  {
    type: 'INDIAN_AADHAAR',
    regex: /\b([2-9][0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4})\b/g,
    token: '[REDACTED_AADHAAR]',
    synthetic: '9999 8888 7777',
    reason: 'Exposes Indian Aadhaar Biometric UID (Critical Personal Data under DPDP Act).',
  },
  {
    type: 'CREDIT_CARD',
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|(?:4\d{3}|5[1-5]\d{2}|6011)[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})\b/g,
    token: '[REDACTED_CREDIT_CARD]',
    synthetic: '4111-2222-3333-4444',
    reason: 'Exposes PCI-DSS regulated cardholder primary account number.',
  },
  {
    type: 'US_SSN',
    regex: /\b([0-9]{3}-[0-9]{2}-[0-9]{4})\b/g,
    token: '[REDACTED_SSN]',
    synthetic: '000-12-3456',
    reason: 'Exposes United States Social Security Number.',
  },
  {
    type: 'EMAIL_ADDRESS',
    regex: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    token: '[REDACTED_EMAIL]',
    synthetic: 'user.redacted@domain-safe.in',
    reason: 'Exposes personal or corporate contact identifier.',
  },
  {
    type: 'PHONE_NUMBER',
    regex: /(?:\+?91[-\s]?)?[6-9]\d{9}\b|\b(?:\+?1[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}\b/g,
    token: '[REDACTED_PHONE]',
    synthetic: '+91-9800000000',
    reason: 'Exposes mobile telephone number (telecom identifier).',
  },
];

export function preScanPIIAndSecrets(text, redactionMode = 'STRICT_MASK') {
  if (!text || typeof text !== 'string') {
    return {
      entities: [],
      sanitizedText: '',
      summary: 'No content analyzed.',
      preScanCount: 0,
    };
  }

  let sanitized = text;
  const entities = [];

  for (const item of DLP_PATTERNS) {
    const regex = new RegExp(item.regex.source, item.regex.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const sensitiveVal = match[1] || fullMatch;

      // Mask hint for audit summary
      const maskedHint =
        sensitiveVal.length > 8
          ? `${sensitiveVal.substring(0, 3)}...${sensitiveVal.substring(sensitiveVal.length - 3)}`
          : '***REDACTED***';

      entities.push({
        entityType: item.type,
        originalHint: maskedHint,
        replacementToken: item.token,
        riskReason: item.reason,
      });

      if (redactionMode === 'STRICT_MASK') {
        sanitized = sanitized.split(fullMatch).join(item.token);
      } else if (redactionMode === 'SYNTHETIC_REPLACE') {
        sanitized = sanitized.split(fullMatch).join(item.synthetic);
      }
      // AUDIT_ONLY leaves sanitized equal to raw text
    }
  }

  // Deduplicate entities by entityType + originalHint
  const uniqueEntities = [];
  const seen = new Set();
  for (const ent of entities) {
    const key = `${ent.entityType}:${ent.originalHint}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEntities.push(ent);
    }
  }

  const summary =
    uniqueEntities.length > 0
      ? `Pre-scanner flagged ${uniqueEntities.length} sensitive patterns: ${uniqueEntities.map((e) => e.entityType).join(', ')}`
      : 'Pre-scanner found 0 static high-entropy secrets or PII matches.';

  return {
    entities: uniqueEntities,
    sanitizedText: sanitized,
    summary,
    preScanCount: uniqueEntities.length,
  };
}

