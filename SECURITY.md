# Security Policy

## Reporting Security Issues

We take the security of VulnSight AI very seriously. If you discover a vulnerability, misconfiguration, or unintended behavior in VulnSight AI, please report it privately rather than opening a public issue.

- **Email:** `security@vulnsight.ai`
- **PGP Key:** Available upon request.

Please include:
1. Target version / commit hash.
2. Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
3. The potential impact (e.g. scope bypass, SSRF vulnerability, key disclosure).

We will acknowledge receipt within 48 hours and work with you to provide a fix prior to public disclosure.

---

## Security Boundaries & Guardrails

- **Target Scoping:** The platform enforces strict boundary checking against user-supplied URLs. Target hosts are resolved and matched against forbidden ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, and AWS/GCP metadata endpoints).
- **Scanner Isolation:** Scan engines run inside isolated worker containers without host volume mounts or privileged access.
- **AI Key Security:** Provider keys are encrypted using AES-256-GCM. Keys are never logged in request access logs, debugging outputs, or serialized into client-side state.
- **Untrusted Input Handling:** Web content inspected during scans is treated as untrusted data to protect against prompt-injection attacks.
