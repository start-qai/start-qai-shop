# Frontend – build React (Vite) i serwowanie statyków przez nginx.
FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

# Adres API wstrzykiwany do buildu (widziany z przeglądarki na hoście).
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build:shared && npm run build --workspace @qai-shop/frontend

# --- Etap serwowania ---
FROM nginx:alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
