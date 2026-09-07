# DocFlow — AI-Powered Codebase Intelligence Platform

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20(React%2019)-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20(pgvector)-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> **DocFlow** is an enterprise-ready codebase intelligence platform that bridges the gap between complex software architectures and engineering teams. It ingests Git repositories, extracts architectural topologies, indexes codebases into high-dimensional vector embeddings using PostgreSQL (`pgvector`), and enables context-grounded, interactive RAG (Retrieval-Augmented Generation) conversations over your software systems.

---

## Architecture Overview

```mermaid
flowchart LR
    subgraph Client["Frontend (Next.js 16)"]
        UI["Dashboard & Chat UI"]
    end

    subgraph Server["Backend (NestJS 11)"]
        Auth["Auth & JWT"]
        Ingest["Git Ingest & Diff Engine"]
        Vector["pgvector Embedding Engine"]
        Analysis["AI Architecture Analyzer"]
        RAG["RAG Chat Engine"]
    end

    subgraph Data["Data & AI Layer"]
        PG[("PostgreSQL 16 + pgvector")]
        Redis[("Redis 7")]
        AI["OpenAI / Alibaba DashScope"]
    end

    UI -->|REST / API| Server
    Server --> PG
    Server --> Redis
    Server --> AI
```

---

## Core Features

- **Automated Repository Ingestion**: Shallow-clones Git repositories, indexes code/text files, and skips binary/bundle noise.
- **Incremental Resync Pipeline**:
  - Compares remote Git `HEAD` commits before cloning to avoid redundant I/O.
  - Uses MD5 content hashing to identify **New**, **Updated**, and **Deleted** files.
  - Re-indexes and generates embeddings only for modified files.
- **pgvector Semantic Search**: Chunks codebase files with sliding window overlap and stores embeddings in PostgreSQL using the `pgvector` extension for sub-millisecond cosine distance retrieval.
- **Architectural Extraction**: Discovers backend REST API endpoints and frontend page routes automatically using LLM-assisted structural analysis.
- **Context-Aware AI Chat**: RAG pipeline retrieving relevant code chunks to answer technical questions, explain architecture, and debug codebase logic.
- **Role-Based Workspaces & Authentication**: JWT cookie/bearer authentication, GitHub OAuth 2.0, avatar management via Cloudinary, and workspace management.

---

## Tech Stack

### Backend (`server/`)
- **Framework**: [NestJS 11](https://nestjs.com/) (TypeScript)
- **Database ORM**: [Prisma 7](https://www.prisma.io/) with PostgreSQL & `pgvector` extension
- **Caching & Queue**: Redis 7
- **AI & Embeddings**: OpenAI SDK (compatible with OpenAI and Alibaba DashScope / Qwen)
- **Git Engine**: `simple-git`
- **Security**: Passport JWT & GitHub OAuth2, Helmet, NestJS Throttler

### Frontend (`client/`)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Styling**: Vanilla CSS & Tailwind CSS
- **Icons**: Material Symbols & FontAwesome

### Infrastructure
- **Containers**: Docker & Docker Compose (`postgres` with pgvector, `redis`, `redisinsight`)

---

## Getting Started

### Prerequisites
- **Node.js**: `v20.x` or later
- **npm** or **pnpm** / **bun**
- **Docker & Docker Compose**

---

### 1. Clone the Repository
```bash
git clone https://github.com/OmarAboelnaga121/DocFlow.git
cd DocFlow
```

---

### 2. Start Infrastructure Services (Docker)
Start PostgreSQL (with `pgvector`) and Redis:
```bash
docker compose up -d
```
Verify services:
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **RedisInsight**: `http://localhost:5540`

---

### 3. Server Configuration & Setup

1. Navigate to the `server/` directory:
   ```bash
   cd server
   npm install
   ```

2. Configure environment variables (`server/.env`):
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docflow?schema=public"

   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=docflow
   POSTGRES_PORT=5432

   REDIS_PORT=6379
   REDISINSIGHT_PORT=5540

   JWT_SECRET="your-secure-jwt-secret"
   FRONTEND_URL="http://localhost:3001"

   # GitHub OAuth (Optional for social login)
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   GITHUB_CALLBACK_URL="http://localhost:3000/auth/github/callback"

   # Cloudinary (Optional for avatar uploads)
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   # OpenAI or Alibaba DashScope LLM & Embeddings
   OPENAI_API_KEY="your-api-key"
   OPENAI_BASE_URL="https://api.openai.com/v1" # or compatible base URL
   OPENAI_MODEL="gpt-4o-mini"
   EMBEDDING_MODEL="text-embedding-3-small"
   ```

3. Run Prisma migrations and generate client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. Start the backend development server:
   ```bash
   npm run start:dev
   ```
   - API Server: `http://localhost:3000`
   - Swagger Documentation: `http://localhost:3000/api/docs`

---

### 4. Client Configuration & Setup

1. Open a new terminal and navigate to the `client/` directory:
   ```bash
   cd client
   npm install
   ```

2. Configure client environment (`client/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3000"
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   - Application URL: `http://localhost:3001` (or `http://localhost:3000` if port 3000 is open)

---

## API Documentation

Swagger OpenAPI documentation is available at `http://localhost:3000/api/docs` when the server is running.

### Key Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user with credentials |
| `POST` | `/auth/login` | Authenticate user & issue JWT cookie |
| `POST` | `/repository` | Ingest a new Git repository by URL & branch |
| `GET` | `/repository` | List all repositories for the authenticated user |
| `GET` | `/repository/:id` | Get repository details, files, analysis, and chats |
| `POST` | `/repository/:id/sync` | Trigger incremental resync for remote commits |
| `DELETE` | `/repository/:id` | Cascading deletion of repository, files, embeddings & chats |
| `POST` | `/chat` | Create a new conversation session for a repository |
| `POST` | `/chat/:id/messages` | Send query & receive context-grounded AI answer |

---

## License

This project is licensed under the MIT License.