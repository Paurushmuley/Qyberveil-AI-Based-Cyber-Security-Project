FROM node:22-alpine AS base

WORKDIR /app

# Copy root manifests and workspace configs
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY prisma ./prisma/
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npm run db:generate

# Build API and shared packages
RUN npm run build --workspace=@vulnsight/shared-types
RUN npm run build --workspace=@vulnsight/validation
RUN npm run build --workspace=@vulnsight/api

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
