FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY prisma ./prisma/
COPY packages/ ./packages/
COPY workers/scan-worker/ ./workers/scan-worker/

RUN npm ci
RUN npm run db:generate
RUN npm run build --workspace=@vulnsight/shared-types
RUN npm run build --workspace=@vulnsight/validation
RUN npm run build --workspace=@vulnsight/scan-worker

CMD ["node", "workers/scan-worker/dist/index.js"]
