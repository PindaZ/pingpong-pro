# PingPong Pro

PingPong Pro is a modern, responsive web application designed to manage ping pong competitions within an organization. It features an ELO-based ranking system, match tracking, and tournament management.

## 📚 Project Overview
*   **Status:** MVP (Internal Use)
*   **Target:** 30+ Colleagues, ~50 matches/week.
*   **Platform:** Web (Desktop & Mobile).

## 🛠 Tech Stack
This project is built with performance and type-safety in mind, optimized for deployment on a generic VPS.

*   **Frontend & Backend:** [Next.js](https://nextjs.org/) (App Router) with [TypeScript](https://www.typescriptlang.org/).
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Dark/Light mode support).
*   **Database:** [PostgreSQL](https://www.postgresql.org/).
*   **ORM:** [Prisma](https://www.prisma.io/) (Schema management & migrations).
*   **Authentication:** Auth.js (NextAuth) or Lucia Auth.
*   **Infrastructure:** Docker & Docker Compose (via [Dokploy](https://dokploy.com/)).
*   **Storage:** S3 Compatible / MinIO.

## 📂 Project Structure

```bash
.
├── .docker/                # Docker configuration
│   ├── Dockerfile
│   └── docker-compose.yml
├── prisma/
│   └── schema.prisma       # Database Schema
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router (Routes & Pages)
│   │   ├── (auth)/         # Authentication routes (login, register)
│   │   ├── (dashboard)/    # Authenticated views (rankings, profile)
│   │   ├── api/            # Backend API routes
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Landing page
│   ├── components/         # React Components
│   │   ├── ui/             # Generic UI kit (Button, Card, Input)
│   │   ├── matches/        # Match-specific components
│   │   └── tournaments/    # Tournament-specific components
│   ├── lib/                # Utilities & Configuration
│   │   ├── auth.ts         # Authentication logic
│   │   ├── db.ts           # Global Prisma Client instance
│   │   └── elo.ts          # ELO calculation logic
│   ├── types/              # Global TypeScript definitions
│   └── styles/             # Global CSS
├── .env.example            # Environment variables template
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 Local Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/organization/pingpong-pro.git
    cd pingpong-pro
    ```

2.  **Environment Setup:**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    *Update `.env` with your local DB credentials if not using the default Docker setup.*

3.  **Start with Docker Compose:**
    This will start the Database (PostgreSQL) and the containerized Application.
    ```bash
    docker-compose up -d
    ```

4.  **Database Migration:**
    Push the schema to your local database:
    ```bash
    npx prisma migrate dev
    ```

5.  **Run Development Server (Hybrid):**
    If you prefer running the Next.js app on `localhost` while keeping the DB in Docker:
    ```bash
    npm install
    npm run dev
    ```
    Visit `http://localhost:3000`.

## 🚀 Deployment

For detailed, step-by-step instructions on deploying to a VPS (Hetzner, DigitalOcean) using **Dokploy**, please refer to the [Server Deployment Guide](DEPLOY.md).

## ⚙️ Environment Variables (`.env.example`)

```ini
# Application
NODE_ENV="development"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-random-string"

# Database (Prisma)
# Connect to the Docker container or external VPS DB
DATABASE_URL="postgresql://user:password@localhost:5432/pingpongpro?schema=public"

# Object Storage (S3/MinIO) used for avatars
S3_ENDPOINT="http://localhost:9000"
S3_BUCKET="pingpong-assets"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
```
