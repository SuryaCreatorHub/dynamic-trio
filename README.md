# SentinelTrust AI — Enterprise AI Security, Privacy & Trust Platform

SentinelTrust AI is an enterprise-grade **AI Security, Privacy & Trust Governance Platform** designed to defend against modern generative AI vulnerabilities. It detects security threats (prompt injections, jailbreaks, malicious payloads), safeguards sensitive corporate & personal data (PII/credential detection with automated redaction), and audits AI pipelines for transparency, demographic bias, and regulatory compliance (India DPDP Act 2023, GDPR, EU AI Act, and NIST AI RMF).

---

## 1. Problem Statement

Enterprises rapidly deploying LLMs and generative AI workflows face four existential security risks:
1. **Sensitive Data & PII Leakage (Shadow AI):** Employees inadvertently paste customer PII, internal credentials, Aadhaar/PAN cards, source code, and secrets into third-party AI models.
2. **Adversarial Threats & Prompt Injection:** Malicious inputs, indirect injections, and jailbreaks override system instructions to execute unauthorized commands or exfiltrate sensitive data.
3. **Opaque Decisions & Regulatory Non-Compliance:** Unexplained hallucination, biased automated scoring, and lack of alignment with statutory frameworks like the **Digital Personal Data Protection (DPDP) Act 2023**, **GDPR**, and **EU AI Act**.
4. **Fragmented Audit Trails:** Security operations teams lack a unified, tamper-evident log of inspected payloads, redacted entities, and interactive AI security consultations.

---

## 2. Solution Overview

**SentinelTrust AI** provides a unified **Security, Privacy & Trust Command Center**:
* **Multi-Engine Security & Privacy Scanner:** Deep static regex pre-scanning combined with semantic Gemini 2.5 Flash inspection across 6 dedicated security domains.
* **Side-by-Side Diff Redaction Shield:** Real-time visual comparison of raw input against sanitized data (`[REDACTED_API_KEY]`, `[REDACTED_EMAIL]`, `[REDACTED_AADHAAR_PAN]`) with 1-click safe export.
* **Interactive AI Security & Trust Copilot:** Multi-turn conversational security architect with live status transitions (`sending` $\rightarrow$ `generating` $\rightarrow$ `completed`) powered by Supabase Realtime.
* **Telemetry Dashboard & Risk Posture:** Real-time KPI counters, Recharts-powered severity distributions, and trust score timelines calculated dynamically from PostgreSQL.
* **Zero Trust & Secret Isolation:** Complete isolation of sensitive keys (`GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` reside exclusively on the Express backend).

---

## 3. Architecture

```
                                  USER BROWSER
                     ┌────────────────────────────────────┐
                     │          Vercel Frontend           │
                     │  React 18 + Vite + Tailwind CSS    │
                     │   Recharts + Supabase Realtime     │
                     └─────────────────┬──────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
         Supabase Auth & Realtime              REST API (Bearer JWT)
                    │                                     │
                    ▼                                     ▼
     ┌─────────────────────────────┐       ┌─────────────────────────────┐
     │      Supabase Cloud         │       │        Render Backend       │
     │  PostgreSQL 15 Database     │◄──────┤ Express 4 + Helmet + CORS   │
     │  Row-Level Security (RLS)   │       │ DLP Pre-Scanner + Zod       │
     │  Realtime WebSocket Stream  │       │ @google/genai SDK           │
     └─────────────────────────────┘       └──────────────┬──────────────┘
                                                          │
                                                          ▼
                                           ┌─────────────────────────────┐
                                           │    Google Gemini API        │
                                           │    gemini-2.5-flash         │
                                           │    Structured JSON Schema   │
                                           └─────────────────────────────┘
```

---

## 4. Target Domains & Detection Capabilities

| Domain Code | Display Name | Core Detection Targets |
| --- | --- | --- |
| `PROMPT_SECURITY` | Prompt Injection & Jailbreak Defense | Direct & indirect prompt injections, system prompt leak attempts, DAN jailbreaks, instruction overrides |
| `PII_PRIVACY_SHIELD` | PII, Credentials & Data Privacy DLP | Emails, phone numbers, Indian Aadhaar & PAN, SSNs, credit cards, AWS/OpenAI/Stripe secrets, JWTs |
| `PHISHING_FRAUD` | Phishing, Social Engineering & Fraud | Spear-phishing, BEC scams, urgent psychological manipulation, malicious links, credential harvesting |
| `AI_TRUST_GOVERNANCE` | AI Model Trust, Bias & Explainability | Demographic bias, unfair discrimination, hallucination risk, opaque decision-making |
| `CODE_VULNERABILITY` | Application & API Security Audit | SQL injection, XSS, SSRF, hardcoded credentials, insecure endpoints, BOLA/IDOR |
| `COMPLIANCE_AUDIT` | Regulatory & Privacy Compliance | India DPDP Act 2023, EU GDPR / EU AI Act, OWASP LLM Top 10, NIST AI RMF, SOC2 |

---

## 5. Technology Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS, `lucide-react`, `recharts`, `react-router-dom` v6
- **Backend:** Node.js, Express.js, `@google/genai` (Google Gen AI SDK), `zod`, `helmet`, `cors`, `express-rate-limit`, `@supabase/supabase-js`
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) and Supabase Realtime
- **AI Engine:** Google Gemini 2.5 Flash (`gemini-2.5-flash`) with structured schema generation

---

## 6. Local Development Setup

### Prerequisites
- Node.js >= 18.x (tested on v24)
- A Supabase project with database credentials
- A Google Gemini API key

### Step 1: Database Migration
1. Go to your Supabase project dashboard -> **SQL Editor**.
2. Run the script located in `supabase/migrations/0001_init.sql`.

### Step 2: Backend Configuration
```bash
cd backend
cp .env.example .env
# Fill in your SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, and FRONTEND_URL
npm install
npm run dev
```
Backend runs at `http://localhost:5000`. Test health at `http://localhost:5000/api/health`.

### Step 3: Frontend Configuration
```bash
cd ../frontend
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_API_BASE_URL=http://localhost:5000
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 7. API Reference

All protected endpoints require `Authorization: Bearer <access_token>`.

### Public Endpoints
* `GET /api/health`
  - Health check for Render and uptime monitoring.
  - Returns `{"ok": true, "service": "sentineltrust-backend", "timestamp": "..."}`.

### Dashboard Endpoints
* `GET /api/dashboard/stats`
  - Returns user-scoped metrics: `totalConversations`, `totalScans`, `totalPiiRedacted`, `avgTrustScore`, `avgRiskScore`, `severityBreakdown`, `trustTrend`, and `recentItems`.

### Security Scans Endpoints
* `POST /api/scans/analyze`
  - Body: `{ title?, domain, complianceFramework, redactionMode, content }`
  - Performs regex pre-scan + Gemini AI audit; saves result to `security_scans` table.
* `GET /api/scans`
  - Query params: `?domain=&severity=`
  - Returns user's scans sorted by `created_at DESC`.
* `GET /api/scans/:id`
  - Returns single scan details.
* `DELETE /api/scans/:id`
  - Deletes a scan record.

### Copilot Conversations Endpoints
* `GET /api/conversations`
  - Returns user's conversations.
* `POST /api/conversations`
  - Body: `{ title?, domain? }`
  - Creates a new conversation thread.
* `GET /api/conversations/:id`
  - Returns conversation metadata and full message history.
* `POST /api/conversations/:id/messages`
  - Body: `{ content, domain? }`
  - Updates conversation status (`sending` -> `generating` -> `completed`), generates AI response, saves to database.
* `DELETE /api/conversations/:id`
  - Deletes conversation and cascades to its messages.

---

## 8. License & Governance
Built for enterprise AI governance, privacy preservation, and cybersecurity defensive auditing.

