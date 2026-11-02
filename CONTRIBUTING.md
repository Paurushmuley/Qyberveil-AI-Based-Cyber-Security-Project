# Contributing to VulnSight AI

Thank you for your interest in contributing to VulnSight AI!

## Code of Conduct

All contributors and maintainers are expected to adhere to professional standards and prioritize user safety and responsible disclosure.

## Monorepo Workflow

VulnSight AI is structured as an npm workspace monorepo:

- `apps/web`: React, Vite, Tailwind CSS frontend dashboard.
- `apps/api`: Express.js backend REST API.
- `packages/shared-types`: Common TypeScript definitions.
- `packages/validation`: Zod validation schemas.
- `workers/scan-worker`: Background security scan executor.
- `prisma/`: Prisma ORM schema and migrations.

### Pull Request Guidelines

1. **Strict Typing:** All new code must be written in TypeScript with `strict: true`. Avoid `any`.
2. **Defensive Validation:** Every public API route must use Zod schemas in `packages/validation` to enforce input validation.
3. **Tests:** Include unit and integration tests using Vitest.
4. **Clean Commits:** Use conventional commits (e.g. `feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
5. **Security First:** Never commit secrets, credentials, or live API keys. Always update `.env.example` when adding environment variables.
