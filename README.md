# Product Catalog

Assignment submission - CRUD system for users, categories and products with Angular, Node/Express and PostgreSQL.

## Stack

- Backend: Express + TypeScript, Prisma (Postgres), Zod, bcrypt, Multer
- Frontend: Angular 18, Angular Material
- DB: Postgres 16, runs in Docker

## Why bulk upload / reports don't time out

Both endpoints just save the request and return a `202` with a `jobId` right away instead of doing the work inline. The actual processing (parsing the CSV / building the CSV or XLSX) happens after the response is sent, in batches, and updates a `jobs` row as it goes. The frontend polls `GET /api/jobs/:id` until it's done. So the request itself never takes long enough to hit a gateway timeout, no matter how big the file is.

## Running it

You need Docker and Node 20+.

Start postgres:

```
docker compose up -d
```

It's mapped to port 5433 instead of 5432 to avoid clashing with any Postgres already running locally.

Backend:

```
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Runs on http://localhost:4000

Frontend:

```
cd frontend
npm install
npm start
```

Runs on http://localhost:4200, points at the API url in `frontend/src/app/core/config.ts`.

## Postman

`postman/collection.json` has every route. For bulk upload, create categories called Electronics, Home and Stationery first (there are requests for that in the collection) so `postman/sample-products.csv` matches up - it also has a couple of bad rows in there on purpose to show the error reporting.

## Routes

- Users: `/api/users` (GET, POST, GET/PUT/DELETE :id)
- Categories: `/api/categories` (same, DELETE returns 409 if a product still points at it)
- Products: `/api/products` (same, create/update take multipart form data for the image)
- Bulk upload: `POST /api/products/bulk-upload` -> `202 { jobId }`
- Reports: `POST /api/products/reports` (`{ format, categoryId?, search? }`) -> `202 { jobId }`
- Jobs: `GET /api/jobs/:id`, `GET /api/jobs/:id/download`

Also supports bulk delete on products - select rows and delete, or "select all matching filters" to delete everything a search/category filter matches.
