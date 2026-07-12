# E-commerceOS Backend

Express.js + TypeScript + Supabase API for the E-commerceOS frontend.

## Stack

- **Express.js** — HTTP server
- **TypeScript** — type safety
- **Supabase** — PostgreSQL database
- **JWT** — access & refresh tokens
- **Zod** — request validation
- **Module pattern** — feature-based folder structure

## Project Structure

```
ecommerceos_backend/
├── src/
│   ├── config/           # env, supabase client
│   ├── modules/
│   │   ├── auth/         # auth module
│   │   └── products/     # products module (bulk upload, list, images)
│   ├── routes/           # API route aggregator
│   ├── shared/
│   │   ├── errors/       # custom error classes
│   │   ├── middleware/   # auth, validation, error handling
│   │   └── utils/        # jwt, password, api-response
│   ├── scripts/          # seed script
│   ├── types/            # database & express types
│   ├── app.ts
│   └── server.ts
├── supabase/
│   └── migrations/       # SQL migrations
├── .env.example
└── package.json
```

## Setup

### 1. Install dependencies

```bash
cd ecommerceos_backend
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:
   - `supabase/migrations/001_auth_tables.sql`
   - `supabase/migrations/002_products.sql`
3. Copy `.env.example` to `.env` and fill in:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_ACCESS_SECRET=your-long-random-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-long-random-refresh-secret-min-32-chars
```

> Use the **service role key** (not anon key) — the backend needs full DB access.

### 3. Seed demo data

```bash
npm run seed
```

Demo credentials (matches frontend mock data):

| Role     | Login                    | Password |
|----------|--------------------------|----------|
| Customer | `01712345678` or `customer@test.com` | `123456` |
| Admin    | `admin@test.com`         | `123456` |

### 4. Run dev server

```bash
npm run dev
```

API runs at `http://localhost:4000`

### 5. Create storage bucket (for product images)

```bash
npm run setup:products
```

Or create a public bucket named `product-images` in Supabase Dashboard → Storage.

## API Endpoints

Base URL: `/api/v1`

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/customer/register` | Register customer |
| `POST` | `/auth/customer/login` | Customer login (phone/email) |
| `POST` | `/auth/admin/login` | Admin login |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Revoke refresh token |
| `GET`  | `/auth/me` | Get current user (Bearer token) |

### Products (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/products` | List all products |
| `POST` | `/products/bulk` | Bulk create/update products by SKU |
| `POST` | `/products/upload-images` | Upload product images (multipart) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Server health check |

## Request / Response Examples

### Customer Login

```http
POST /api/v1/auth/customer/login
Content-Type: application/json

{
  "identifier": "01712345678",
  "password": "123456",
  "method": "phone"
}
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "জনাব করিম",
      "phone": "01712345678",
      "email": "customer@test.com",
      "address": "ধানমন্ডি, ঢাকা-১২০৫",
      "source": "default"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  },
  "message": "Login successful"
}
```

### Campaign Register (auto-password = last 4 digits of phone)

```http
POST /api/v1/auth/customer/register
Content-Type: application/json

{
  "name": "নতুন গ্রাহক",
  "phone": "01899887766",
  "email": "new@example.com",
  "address": "গুলশান, ঢাকা",
  "source": "campaign"
}
```

### Admin Login

```http
POST /api/v1/auth/admin/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "123456"
}
```

## Frontend Integration

Set in `ecommerceos_frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Use `Authorization: Bearer <accessToken>` header for protected routes.
