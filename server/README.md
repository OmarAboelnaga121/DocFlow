# DocFlow Backend

DocFlow is a NestJS backend for repository ingestion, Git analysis, chat-based code understanding, authentication, subscriptions, and AI-powered repository insights.

## Tech stack

- Node.js + NestJS
- TypeScript
- PostgreSQL + Prisma
- Redis
- OpenAI API
- Cloudinary
- PayPal subscriptions
- JWT-based authentication

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Redis server
- OpenAI API key
- Cloudinary account
- PayPal credentials (for billing features)

## Local setup

```bash
cd server
npm install
```

Create a `.env` file in the server root and configure the required values:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
DATABASE_URL=postgresql://user:password@localhost:5432/docflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_MS=120000
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENV=sandbox
```

Initialize the database:

```bash
npx prisma generate
npx prisma migrate deploy
```

Run the app:

```bash
npm run start:dev
```

## Production build

```bash
npm run build
npm run start:prod
```

## Testing

```bash
npm run test
npm run test:cov
npm run test:e2e
```

## Important production rules

- Never run with a missing or fake `OPENAI_API_KEY`.
- Validate required environment variables at startup.
- Keep secrets in a secure runtime environment, not in source control.
- Use a managed PostgreSQL and Redis service for production deployment.
- Configure CORS and cookie settings for the deployed frontend domain.
- Run behind a reverse proxy or container orchestrator with health checks.

## Deployment notes

This backend is intended to be deployed as a separate service from the frontend. In production, ensure:

- the frontend domain is allowed in `FRONTEND_URL`
- `NODE_ENV=production`
- `JWT_SECRET` is strong and unique
- database migrations are applied before server startup
- logs, metrics, and alerts are connected to your hosting platform

## API docs

Swagger is available at:

```text
http://localhost:3000/api/docs
```

## Project status

This repository includes a working modular NestJS backend and is suitable for continued development and staging deployment, but production hardening should be completed before public launch.
