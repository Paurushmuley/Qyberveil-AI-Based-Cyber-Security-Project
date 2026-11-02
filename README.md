# Qyberveil
> **Discover vulnerabilities. Understand risk. Secure with confidence.**

Qyberveil is a production-minded, open-source AI-powered application security assessment platform designed for developers, AppSec engineers, and security auditors. It orchestrates automated vulnerability scanning (OWASP ZAP & OpenAPI discovery), performs scope and target authorization verification, and leverages provider-agnostic AI to triage findings, eliminate hallucinations, explain business impact, and deliver framework-specific remediation code.

---

## 🏛️ Architecture Overview

The platform uses a decoupled monorepo architecture:

```
qyberveil/
  apps/
    web/              # React, Vite, TypeScript, Tailwind CSS, TanStack Query
    api/              # Node.js, Express.js, TypeScript, REST API, Helmet, Zod
  packages/
    shared-types/     # Shared domain interfaces, Enums, and API envelopes
    validation/       # Runtime Zod validation schemas with SSRF guards
    ai-providers/     # (M2) Modular adapters: OpenAI, Gemini, Grok, Ollama
    scanner/          # (M3) Scanner orchestrator & finding normalizer
    reports/          # (M5) PDF generator engine
  workers/
    scan-worker/      # Isolated Docker-capable worker running BullMQ
  prisma/
    schema.prisma     # PostgreSQL data model (11 models)
  docker-compose.yml  # Multi-service local stack (Postgres, Redis, Ollama, API, Web)
  .env.example        # Environment variable template
  SECURITY.md         # Vulnerability reporting & security boundaries
  CONTRIBUTING.md     # Development standards & guidelines
```

### Data Flow

```
[User Browser (React + Vite)]
         │
         ▼  (REST + Zod Validation)
[VulnSight API (Express.js)] ───► [PostgreSQL (Prisma ORM)]
         │                              ▲
         ▼ (BullMQ Queue)               │ (Structured Findings)
[Scan Worker (Isolated Container)] ─────┤
         │                              │
         ├─► [OWASP ZAP Engine]         │
         │                              │
         └─► [AI Provider Adapter] ─────┘
             (OpenAI / Gemini / Grok / Local Ollama)
```

---

## 🧠 AI Provider System (Milestone 2)

VulnSight AI provides a modular, provider-independent AI subsystem in `packages/ai-providers`:

| Provider | SDK / Integration | Supported Models | Key Features |
| :--- | :--- | :--- | :--- |
| **Google Gemini** | `@google/generative-ai` | `gemini-2.0-flash` (Default), `gemini-1.5-pro`, `gemini-1.5-flash` | High throughput, 1M+ context window, native JSON schema support. |
| **OpenAI** | `openai` | `gpt-4o` (Default), `gpt-4o-mini`, `o3-mini` | State-of-the-art AppSec vulnerability reasoning, JSON mode. |
| **xAI Grok** | `openai` (`https://api.x.ai/v1`) | `grok-2` (Default), `grok-2-mini`, `grok-beta` | Deep technical reasoning with strong coding and exploit verification. |
| **Ollama (Local)** | Native HTTP API | `llama3.3` (Default), `deepseek-r1`, `qwen2.5-coder`, `mistral` | Fully offline, zero telemetry, no cloud API key required. |

### Credential Protection & Server-Side Encryption
- **Authenticated AES-256-GCM:** API keys are encrypted immediately upon server reception using a random 96-bit IV and 128-bit authentication tag.
- **Zero Client Exposure:** Plaintext keys are never returned to frontend JavaScript after submission. The UI only sees a masked format (e.g. `sk-...cdef`).
- **No Log Leakage:** HTTP request loggers and exception handlers explicitly suppress authentication headers, decrypted credentials, and request payloads containing secrets.
- **Hosted vs. Local Execution:** In local development, Ollama runs on `http://localhost:11434` without cloud keys. In hosted deployments (such as Vercel), serverless functions cannot connect to a user's localhost; cloud providers are used instead.

---

## 🚀 Quickstart & Local Development

### Prerequisites
- **Node.js**: `v20+` or `v22+`
- **npm**: `v10+`
- **Docker & Docker Compose** (for isolated database, redis, and scanner execution)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/vulnsight-ai.git
cd vulnsight-ai
npm install
```

### 2. Configure Environment

Copy the example configuration:

```bash
cp .env.example .env
```

### 3. Database Setup

Generate the Prisma Client:

```bash
npm run db:generate
```

Push database schema to PostgreSQL:

```bash
npm run db:push
```

### 4. Running the Stack

#### Option A: Docker Compose (Full Stack)
Spins up PostgreSQL, Redis, Ollama, the API server, the Web dashboard, and the Scan Worker:

```bash
docker compose up -d
```

#### Option B: Local Node.js Development
If you have PostgreSQL running locally:

```bash
# Start both API and Web concurrently
npm run dev

# Or run separately:
npm run dev:api    # Runs on http://localhost:4000
npm run dev:web    # Runs on http://localhost:5173
```

---

## 🛡️ Health Check Verification

The API exposes an automated health-check diagnostic endpoint verifying database and queue connectivity:

```bash
curl http://localhost:4000/health
```

Sample Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "0.1.0",
    "uptimeSeconds": 142,
    "environment": "development",
    "services": {
      "database": {
        "status": "connected",
        "latencyMs": 4
      },
      "redis": {
        "status": "connected",
        "latencyMs": 1
      }
    }
  },
  "timestamp": "2026-10-28T11:40:00.000Z"
}
```

---

## 🔒 Security Principles

1. **Authorization Mandatory:** Scans cannot be executed without explicit authorization and verified domain ownership.
2. **SSRF Guardrails:** Target URLs are validated to block private IPv4/IPv6 ranges, loopback (`localhost`, `127.0.0.1`), and cloud metadata (`169.254.169.254`).
3. **Evidence-Based AI:** AI suggestions are explicitly grounded in raw scanner evidence; vulnerabilities are never fabricated or claimed confirmed without proof.
4. **Zero Key Storage:** AI provider API keys are encrypted server-side using AES-256-GCM and never exposed to the browser.
