# 🚀 Server Deployment Guide (Dokploy / VPS)

This guide details the steps to deploy **PingPong Pro** to a standard Linux VPS (e.g., Hetzner, DigitalOcean) using **Dokploy**.

## Prerequisites

1.  **A Linux VPS** (Ubuntu 20.04/22.04 recommended).
2.  **Domain Name** pointed to your VPS IP address (A Record).
3.  **Dokploy Installed** on your server.
    *   *If not installed:* `curl -sSL https://dokploy.com/install.sh | sh`
4.  **GitHub Connected**: You must link your GitHub account in Dokploy **Settings** -> **Git**.

---

## Deployment Strategy

We will use **Dokploy** to manage two components:
1.  **Database**: A PostgreSQL container managed by Dokploy.
2.  **Application**: The Next.js app built from the repository's `Dockerfile`.

---

## Step 1: Set up the Database

1.  Log in to your Dokploy panel.
2.  Navigate to your Project (or create one).
3.  Go to **Databases** -> **Create Database**.
4.  Select **PostgreSQL**.
5.  **Configuration**:
    *   **Name**: `pingpong-db` (or similar)
    *   **User/Password**: Note these down (or let Dokploy generate them).
    *   **Internal Port**: Default is `5432`.
6.  **Create**.
7.  Once created, copy the **Internal Connection URL**. It usually looks like:
    `postgresql://user:password@pingpong-db:5432/db_name`
    *(Note: Using the internal service name `pingpong-db` is faster and safer than the public IP).*

---

## Step 2: Deploy the Application

1.  Go to **Services** -> **Create Service**.
2.  Select **Application**.
3.  **Source Code**:
    *   **Provider**: GitHub
    *   **Repository**: `PindaZ/pingpong-pro`
    *   **Branch**: `main`
4.  **Build Configuration**:
    *   **Build Type**: `Docker`
    *   **Dockerfile Path**: `./Dockerfile` (default)
5.  **Environment Variables**:
    *   Go to the **Environment** tab.
    *   Add the following variables:
        ```env
        # Database Connection (From Step 1)
        DATABASE_URL=postgresql://user:password@pingpong-db:5432/db_name

        # NextAuth Configuration
        NEXTAUTH_URL=https://your-domain.com
        NEXTAUTH_SECRET=generate_a_secure_random_string_here

        # Production Mode
        NODE_ENV=production
        ```
6.  **Network / Ports**:
    *   Next.js runs on port `3000` inside the container.
    *   Set **Container Port** to `3000`.
7.  **Domain**:
    *   Go to **Domains** tab.
    *   Add your domain (e.g., `pingpong.your-domain.com`).
    *   Enable **HTTPS** (Let's Encrypt).

---

## Step 3: Deployment & Migrations

1.  **Deploy**: Click the **Deploy** button in Dokploy.
    *   Dokploy will pull the code, build the Docker image (using the multi-stage build), and start the container.
2.  **Database Migrations**:
    *   The database starts empty. We need to push the schema.
    *   Since the app is running in a container, the easiest way to run migrations is to use the Dokploy **Console/Shell** for the *Application* or run it locally pointed to the remote DB (if port is exposed).
    *   **Recommended (Console)**:
        1. Open the **Console** tab in your Application service.
        2. Run: `npx prisma migrate deploy`
        3. This applies the migrations to the connected `DATABASE_URL`.

---

## Step 4: Verification

1.  Visit your domain (`https://pingpong.your-domain.com`).
2.  You should see the Login page.
3.  **First User**: The first user you register will automatically be the `SUPERADMIN`.
    *   Go to `/register` and create your account.

---

## Troubleshooting

*   **Build Fails?** Check the "Logs" tab. Ensure `Dockerfile` is present and dependencies are installing.
*   **Database Error?** Check `DATABASE_URL`. If using Dokploy's internal network, ensure the hostname matches the database service name.
*   **502 Bad Gateway?** Ensure the Application Port is set to `3000` in Dokploy settings.
