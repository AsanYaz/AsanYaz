# AsanYaz - Akademik Sənəd Platforması

AsanYaz is an automated platform for Azerbaijani university students to order and generate academic documents (assignments, essays, presentations, etc.) formatted according to their specific university standards.

## Architecture

This is a monorepo containing multiple services:

- `apps/api`: NestJS backend API. Handles auth, orders, payments, database logic.
- `apps/worker`: Node.js BullMQ worker. Processes background jobs (calling AI APIs).
- `apps/document-service`: Python FastAPI service. Generates DOCX/PPTX files based on AI output and university templates.
- `apps/web`: Astro + React frontend web application.
- `packages/database`: Shared database schemas, migrations, and seed scripts.
- `packages/types`: Shared TypeScript interfaces.

## Prerequisites

- Node.js (v18+)
- Python (3.11+)
- PostgreSQL
- Redis
- API Keys: OpenAI (or Gemini), Resend (for emails, optional for dev)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```
   Ensure PostgreSQL and Redis connection strings are correct.

3. **Database Setup:**
   Run migrations and seed the database with initial universities/services:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Python Document Service Setup:**
   ```bash
   cd apps/document-service
   pip install -r requirements.txt
   ```

## Running the Services (Development)

You need to run these in separate terminal tabs/windows:

1. **Start the API Server:**
   ```bash
   cd apps/api
   npm run dev
   ```
   *Runs on http://localhost:3000*

2. **Start the Worker:**
   ```bash
   cd apps/worker
   npm run dev
   ```

3. **Start the Document Service:**
   ```bash
   cd apps/document-service
   uvicorn main:app --reload --port 8000
   ```
   *Runs on http://localhost:8000*

4. **Start the Web Frontend:**
   ```bash
   cd apps/web
   npm run dev
   ```
   *Runs on http://localhost:4321*

## Testing the Flow

1. Go to http://localhost:4321/register and create an account.
2. Navigate to Dashboard -> Yeni Sifariş.
3. Select a service, university, and fill out details.
4. Click "Ödəniş et və Sifarişi tamamla" (payment is simulated for dev).
5. Watch the `apps/worker` logs as it processes the AI generation.
6. Once the status changes to "Tamamlandı" in the dashboard, you can view the mock file generation status.

## Admin Panel

You can access the admin panel at `http://localhost:4321/admin/login`.
An admin user is created during `npm run db:seed`. Check the seed file for credentials (default: admin@asanyaz.com / admin123).
