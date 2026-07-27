# Start QAI Shop

> 🇬🇧 **English version below** – see [English version](#english-version).

Testowy sklep internetowy przygotowany na potrzeby szkolenia Start QAI.
Monorepo w TypeScript: **React + Vite** (frontend), **Express + Zod** (backend/REST API),
**Prisma + SQLite** (baza z automatycznym seedem). Uruchamiany jednym poleceniem przez
Docker Compose lub ręcznie przez `npm`.

> Uwierzytelnianie jest **symulowane** – logowanie zwraca zahardkodowany token.
> Płatność również jest symulowana (zamówienie zawsze kończy się statusem `PAID`).

---

## Stack

| Warstwa  | Technologie                                                       |
| -------- | ----------------------------------------------------------------- |
| Frontend | React 18, Vite, React Router, TypeScript                          |
| Backend  | Express 4, Zod (walidacja), Swagger UI (OpenAPI), TypeScript, tsx |
| Baza     | SQLite + Prisma ORM (ten sam silnik w obu trybach uruchomienia)   |
| Współdz. | `@qai-shop/shared` – wspólne typy, schematy Zod, stałe, dane seed |
| Testy    | Vitest, Supertest (API), React Testing Library                    |

## Struktura projektu

```
start-qai-shop/
├─ apps/
│  ├─ backend/      # Express API + Prisma + Swagger (/docs)
│  └─ frontend/     # React + Vite (SPA)
├─ packages/
│  └─ shared/       # wspólne typy, schematy Zod, stałe, dane seed
├─ docker-compose.yml
└─ package.json     # npm workspaces
```

---

## Uruchomienie A: Docker Compose (zalecane)

Wymagania: Docker + Docker Compose v2.

```bash
docker compose up --build
```

Po starcie:

| Usługa                     | URL                        |
| -------------------------- | -------------------------- |
| Frontend (sklep)           | http://localhost:5173      |
| API                        | http://localhost:4000/api  |
| Swagger (dokumentacja API) | http://localhost:4000/docs |

Baza SQLite jest tworzona i **seedowana automatycznie** przy pierwszym starcie kontenera
backendu (skrypt `docker-entrypoint.sh`). Dane trwają na wolumenie `backend-db`.

Zatrzymanie: `docker compose down` (dodaj `-v`, aby usunąć również bazę).

---

## Uruchomienie B: ręcznie przez npm

Wymagania: Node.js >= 20, npm >= 10.

```bash
# 1. Instalacja zależności (dla wszystkich workspace'ów)
npm install

# 2. Konfiguracja backendu – skopiuj przykładowy plik .env do katalogu backendu
cp .env.example apps/backend/.env

# 3. Utworzenie bazy SQLite + seed danych testowych
npm run db:setup

# 4. Start backendu i frontendu równocześnie
npm run dev
```

- Frontend: http://localhost:5173
- API + Swagger: http://localhost:4000/docs

Pojedyncze usługi: `npm run dev:backend` lub `npm run dev:frontend`.
Ponowny seed bazy: `npm run seed`.

---

## Logowanie (symulowane)

Uwierzytelnianie **nie używa OAuth** – to celowo uproszczona symulacja na potrzeby szkolenia.

- **Dane demo:** login `demo`, hasło `demo123`
- Po zalogowaniu API zwraca stały token: `qai-shop-demo-token-2026`
- Token trafia w nagłówek `Authorization: Bearer <token>` przy każdym żądaniu do chronionych zasobów
- Brak lub niepoprawny token → odpowiedź **401 Unauthorized**

Dane demo i token można nadpisać zmiennymi środowiskowymi backendu
(`DEMO_USERNAME`, `DEMO_PASSWORD`, `DEMO_AUTH_TOKEN`).

---

## Przepływ w aplikacji (ekrany)

1. **Logowanie** – formularz z wstępnie wypełnionymi danymi demo.
2. **Lista produktów** – tytuł, zdjęcie, cena; przycisk „Do koszyka”.
3. **Produkt** – tytuł, zdjęcie, opis, wybór ilości, powrót / dodanie do koszyka.
4. **Koszyk** – pozycje, zmiana ilości, „Kup teraz” / powrót.
5. **Podsumowanie** – potwierdzenie zakupu (numer zamówienia); koszyk zostaje wyczyszczony.

---

## REST API

Bazowy prefiks: `/api`. Pełna, interaktywna dokumentacja: **http://localhost:4000/docs**
(schemat OpenAPI JSON: `http://localhost:4000/docs/openapi.json`).

| Metoda | Ścieżka                | Auth | Opis                                        |
| ------ | ---------------------- | :--: | ------------------------------------------- |
| GET    | `/api/health`          |  ✗   | Status serwera                              |
| POST   | `/api/auth/login`      |  ✗   | Logowanie – zwraca token i dane użytkownika |
| GET    | `/api/products`        |  ✓   | Lista produktów                             |
| GET    | `/api/products/:id`    |  ✓   | Szczegóły produktu                          |
| POST   | `/api/products`        |  ✓   | Utworzenie produktu                         |
| PUT    | `/api/products/:id`    |  ✓   | Aktualizacja produktu                       |
| DELETE | `/api/products/:id`    |  ✓   | Usunięcie produktu                          |
| GET    | `/api/cart`            |  ✓   | Zawartość koszyka                           |
| POST   | `/api/cart`            |  ✓   | Dodanie pozycji do koszyka                  |
| PATCH  | `/api/cart/:productId` |  ✓   | Zmiana ilości pozycji                       |
| DELETE | `/api/cart/:productId` |  ✓   | Usunięcie pozycji z koszyka                 |
| DELETE | `/api/cart`            |  ✓   | Wyczyszczenie koszyka                       |
| POST   | `/api/checkout`        |  ✓   | Finalizacja zakupu (czyści koszyk)          |

### Szybki test przez curl

```bash
# Logowanie
curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"demo123"}'

# Lista produktów (z tokenem)
curl -s http://localhost:4000/api/products \
  -H 'Authorization: Bearer qai-shop-demo-token-2026'
```

---

## Testy

```bash
npm test            # wszystkie testy (backend + frontend)
npm run test:backend
npm run test:frontend
```

- **Backend** – testy jednostkowe (kalkulacja koszyka) oraz integracyjne API przez Supertest,
  na osobnej bazie `test.db` resetowanej przed uruchomieniem.
- **Frontend** – testy komponentów i widoków (React Testing Library).

Weryfikacja typów / build całości: `npm run build`.

---

## Zmienne środowiskowe (backend)

Wzór: `.env.example` (w katalogu głównym repozytorium) – skopiuj do `apps/backend/.env`.

| Zmienna           | Domyślnie                  | Opis                          |
| ----------------- | -------------------------- | ----------------------------- |
| `PORT`            | `4000`                     | Port API                      |
| `DATABASE_URL`    | `file:./prisma/dev.db`     | Ścieżka do bazy SQLite        |
| `FRONTEND_ORIGIN` | `http://localhost:5173`    | Dozwolony origin CORS         |
| `DEMO_AUTH_TOKEN` | `qai-shop-demo-token-2026` | Token zwracany po zalogowaniu |
| `DEMO_USERNAME`   | `demo`                     | Login demo                    |
| `DEMO_PASSWORD`   | `demo123`                  | Hasło demo                    |

Frontend używa `VITE_API_URL` (adres API) – w Dockerze ustawiany podczas budowania obrazu.

---

---

# English version

Demo e-commerce shop built for the Start QAI training.
TypeScript monorepo: **React + Vite** (frontend), **Express + Zod** (backend/REST API),
**Prisma + SQLite** (database with automatic seeding). Runs with a single command via
Docker Compose or manually via `npm`.

> Authentication is **simulated** – login returns a hardcoded token.
> Payment is simulated as well (an order always ends with the `PAID` status).

---

## Stack

| Layer    | Technologies                                                       |
| -------- | ------------------------------------------------------------------ |
| Frontend | React 18, Vite, React Router, TypeScript                           |
| Backend  | Express 4, Zod (validation), Swagger UI (OpenAPI), TypeScript, tsx |
| Database | SQLite + Prisma ORM (same engine in both run modes)                |
| Shared   | `@qai-shop/shared` – shared types, Zod schemas, constants, seed    |
| Tests    | Vitest, Supertest (API), React Testing Library                     |

## Project structure

```
start-qai-shop/
├─ apps/
│  ├─ backend/      # Express API + Prisma + Swagger (/docs)
│  └─ frontend/     # React + Vite (SPA)
├─ packages/
│  └─ shared/       # shared types, Zod schemas, constants, seed data
├─ docker-compose.yml
└─ package.json     # npm workspaces
```

---

## Run mode A: Docker Compose (recommended)

Requirements: Docker + Docker Compose v2.

```bash
docker compose up --build
```

After startup:

| Service            | URL                        |
| ------------------ | -------------------------- |
| Frontend (shop)    | http://localhost:5173      |
| API                | http://localhost:4000/api  |
| Swagger (API docs) | http://localhost:4000/docs |

The SQLite database is created and **seeded automatically** on the first start of the
backend container (`docker-entrypoint.sh` script). Data persists on the `backend-db` volume.

Stopping: `docker compose down` (add `-v` to remove the database as well).

---

## Run mode B: manually via npm

Requirements: Node.js >= 20, npm >= 10.

```bash
# 1. Install dependencies (for all workspaces)
npm install

# 2. Configure the backend – copy the example .env into the backend directory
cp .env.example apps/backend/.env

# 3. Create the SQLite database + seed test data
npm run db:setup

# 4. Start the backend and frontend simultaneously
npm run dev
```

- Frontend: http://localhost:5173
- API + Swagger: http://localhost:4000/docs

Individual services: `npm run dev:backend` or `npm run dev:frontend`.
Re-seed the database: `npm run seed`.

---

## Login (simulated)

Authentication **does not use OAuth** – it is a deliberately simplified simulation for training.

- **Demo credentials:** username `demo`, password `demo123`
- After logging in the API returns a fixed token: `qai-shop-demo-token-2026`
- The token goes into the `Authorization: Bearer <token>` header on every request to protected resources
- Missing or invalid token → **401 Unauthorized** response

The demo credentials and token can be overridden with backend environment variables
(`DEMO_USERNAME`, `DEMO_PASSWORD`, `DEMO_AUTH_TOKEN`).

---

## Application flow (screens)

1. **Login** – form pre-filled with the demo credentials.
2. **Product list** – title, image, price; "Add to cart" button.
3. **Product** – title, image, description, quantity selection, back / add to cart.
4. **Cart** – items, quantity change, "Buy now" / back.
5. **Summary** – purchase confirmation (order number); the cart is cleared.

---

## REST API

Base prefix: `/api`. Full, interactive documentation: **http://localhost:4000/docs**
(OpenAPI JSON schema: `http://localhost:4000/docs/openapi.json`).

| Method | Path                   | Auth | Description                             |
| ------ | ---------------------- | :--: | --------------------------------------- |
| GET    | `/api/health`          |  ✗   | Server status                           |
| POST   | `/api/auth/login`      |  ✗   | Login – returns token and user data     |
| GET    | `/api/products`        |  ✓   | Product list                            |
| GET    | `/api/products/:id`    |  ✓   | Product details                         |
| POST   | `/api/products`        |  ✓   | Create a product                        |
| PUT    | `/api/products/:id`    |  ✓   | Update a product                        |
| DELETE | `/api/products/:id`    |  ✓   | Delete a product                        |
| GET    | `/api/cart`            |  ✓   | Cart contents                           |
| POST   | `/api/cart`            |  ✓   | Add an item to the cart                 |
| PATCH  | `/api/cart/:productId` |  ✓   | Change item quantity                    |
| DELETE | `/api/cart/:productId` |  ✓   | Remove an item from the cart            |
| DELETE | `/api/cart`            |  ✓   | Clear the cart                          |
| POST   | `/api/checkout`        |  ✓   | Finalize the purchase (clears the cart) |

### Quick test via curl

```bash
# Login
curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"demo123"}'

# Product list (with token)
curl -s http://localhost:4000/api/products \
  -H 'Authorization: Bearer qai-shop-demo-token-2026'
```

---

## Tests

```bash
npm test            # all tests (backend + frontend)
npm run test:backend
npm run test:frontend
```

- **Backend** – unit tests (cart calculation) and API integration tests via Supertest,
  on a separate `test.db` database reset before each run.
- **Frontend** – component and view tests (React Testing Library).

Type checking / full build: `npm run build`.

---

## Environment variables (backend)

Template: `.env.example` (in the repository root) – copy it to `apps/backend/.env`.

| Variable          | Default                    | Description                 |
| ----------------- | -------------------------- | --------------------------- |
| `PORT`            | `4000`                     | API port                    |
| `DATABASE_URL`    | `file:./prisma/dev.db`     | Path to the SQLite database |
| `FRONTEND_ORIGIN` | `http://localhost:5173`    | Allowed CORS origin         |
| `DEMO_AUTH_TOKEN` | `qai-shop-demo-token-2026` | Token returned after login  |
| `DEMO_USERNAME`   | `demo`                     | Demo username               |
| `DEMO_PASSWORD`   | `demo123`                  | Demo password               |

The frontend uses `VITE_API_URL` (API address) – set during image build in Docker.
