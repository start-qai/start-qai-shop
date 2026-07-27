# Backend – Express API + Prisma (SQLite). Kontekst budowania = katalog główny monorepo.
FROM node:20-slim

# OpenSSL jest wymagany przez Prisma.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Najpierw manifesty (lepszy cache warstw). Wszystkie package.json workspaces muszą być obecne.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/

RUN npm ci

# Kod źródłowy potrzebny w runtime (backend uruchamiany przez tsx).
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Build pakietu współdzielonego + wygenerowanie klienta Prisma.
RUN npm run build:shared \
    && npm run prisma:generate --workspace @qai-shop/backend

ENV NODE_ENV=production
EXPOSE 4000

ENTRYPOINT ["sh", "apps/backend/docker-entrypoint.sh"]
