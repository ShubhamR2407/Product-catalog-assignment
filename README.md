# Product Catalog

A full-stack CRUD system for Users, Categories, and Products, built with **Angular**, **Node.js/Express**, and **PostgreSQL**. Includes server-side paginated/sortable/searchable product listing, background bulk CSV upload, and background CSV/XLSX report generation — both designed to never hit a `504` regardless of file size.

## Stack

- **Backend**: Express + TypeScript, Prisma ORM (PostgreSQL), Zod validation, bcrypt, Multer, `csv-parse`/`csv-stringify`, ExcelJS (streaming)
- **Frontend**: Angular 18 (standalone components), Angular Material
- **Database**: PostgreSQL 16 (via Docker Compose)

## Architecture notes

### Avoiding 504s on bulk upload and reports

Both features use the same async job pattern instead of doing the work inline on the HTTP request:

1. The `POST` endpoint saves the uploaded file (or records the report request) as a `jobs` row with `status='pending'` and responds **immediately** with `202 { jobId }`.
2. The actual work — streaming/parsing the CSV and batch-inserting rows, or cursor-paginating the database and streaming a CSV/XLSX file to disk — runs via `setImmediate()` after the response has already been sent, in batches of ~500 rows.
3. The frontend polls `GET /api/jobs/:id` every 1.5s for progress, and downloads the finished report via `GET /api/jobs/:id/download` once `status === 'completed'`.

This means the initial request always returns in milliseconds no matter how large the file or report is, and processing time can never trigger a gateway timeout. There's no Redis/queue involved — that's a reasonable production upgrade path, not a requirement at this scale.

### Product list API

`GET /api/products` supports:
- `page` / `limit` — server-side pagination
- `sortBy=price&order=asc|desc` — sort by price
- `search=` — matches product name **or** category name
- `categoryId=` — exact category filter (indexed)

## Getting started

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL — no native Postgres install needed)

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This runs Postgres on `localhost:5433` (mapped from the container's 5432, to avoid clashing with any Postgres you already have on the default port). Credentials are in `docker-compose.yml` and already match `backend/.env.example`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

The API runs on `http://localhost:4000`. Health check: `GET http://localhost:4000/api/health`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

The app runs on `http://localhost:4200` and talks to the API at `http://localhost:4000/api` (see `frontend/src/app/core/config.ts` if you need to point it elsewhere).

## Testing the API

Import [`postman/collection.json`](postman/collection.json) into Postman. It covers every endpoint with example bodies. A `{{baseUrl}}` variable points at `http://localhost:4000/api`, and several requests auto-populate `categoryId`/`productId`/`userId`/`jobId` collection variables via test scripts as you run them.

For bulk upload, first create the **Electronics**, **Home**, and **Stationery** categories (requests are in the Categories folder) so [`postman/sample-products.csv`](postman/sample-products.csv) resolves correctly — it also includes two intentionally invalid rows to demonstrate row-level error reporting.

## Project structure

```
product-catalog-assignment/
├── docker-compose.yml       # PostgreSQL
├── backend/                 # Express + TypeScript API
│   ├── prisma/schema.prisma # User/Category/Product/Job models
│   └── src/
│       ├── modules/         # users, categories, products, bulk-upload, reports, jobs
│       ├── middleware/      # validation, error handling, multer upload configs
│       └── db/prisma.ts
├── frontend/                # Angular 18 app
│   └── src/app/
│       ├── core/             # services, models, API base URL
│       └── features/         # users, categories, products (list/form/bulk-upload/reports)
└── postman/
    ├── collection.json
    └── sample-products.csv
```

## API summary

| Resource | Endpoints |
|---|---|
| Users | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id` |
| Categories | `GET/POST /api/categories`, `GET/PUT/DELETE /api/categories/:id` (delete blocked with `409` if products reference it) |
| Products | `GET/POST /api/products`, `GET/PUT/DELETE /api/products/:id` (create/update accept `multipart/form-data` with an optional `image` file) |
| Bulk upload | `POST /api/products/bulk-upload` (multipart CSV, field `file`) → `202 { jobId }` |
| Reports | `POST /api/products/reports` (`{ format: 'csv'|'xlsx', categoryId?, search? }`) → `202 { jobId }` |
| Jobs | `GET /api/jobs`, `GET /api/jobs/:id`, `GET /api/jobs/:id/download` |

Full request/response shapes are in the Postman collection.
