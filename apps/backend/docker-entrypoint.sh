#!/bin/sh
# Entrypoint kontenera backendu:
# 1) tworzy/aktualizuje schemat bazy SQLite (na wolumenie),
# 2) seeduje dane testowe (idempotentnie),
# 3) startuje serwer API.
set -e

cd /app/apps/backend

# Katalog na plik bazy (montowany jako wolumen) – nie koliduje z prisma/schema.prisma.
mkdir -p data

echo "→ Prisma: synchronizacja schematu bazy..."
npx prisma db push --skip-generate

echo "→ Seed danych testowych..."
npx tsx prisma/seed.ts

echo "→ Start serwera API..."
exec npm run start
