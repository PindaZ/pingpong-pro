# 🔄 Migrating n8n to Dokploy

Since we installed Dokploy, your existing `n8n` setup (via Caddy) was stopped. You can restore it immediately using Dokploy's "Compose" feature.

## 1. Get your Deployment Info

We recovered your configuration:
*   **Domain**: `n8n.jdwebsite.nl`
*   **Data Path**: `/root/n8n/data`
*   **File Path**: `/root/n8n/files`
*   **Database**: It connects to an existing generic Postgres container (`root-postgres-1`).

## 2. Deploy in Dokploy

1.  Open your Dokploy Dashboard on IP (e.g., `http://<your-ip>`).
    *   *Note: First time setup requires creating an admin account.*
2.  Create a **New Project** (e.g., "Automation").
3.  Click **Create Service** -> **Compose**.
4.  Name it `n8n-stack`.
5.  In the **Compose** editor, paste the following configuration:

    ```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=root-postgres-1
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=E2m3zr4y!
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=E2m3zr4y!
      - N8N_HOST=n8n.jdwebsite.nl
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.jdwebsite.nl/
      - N8N_SECURE_FILE_ACCESS_CONTROL=false
      - N8N_ALLOWED_FILE_PATHS=/home/node/.n8n,/home/node/.n8n/data,/files
      - GENERIC_TIMEZONE=Europe/Amsterdam
    volumes:
      - /root/n8n/data:/home/node/.n8n
      - /root/n8n/files:/files
    networks:
      - dokploy-network
      - web # Existing network for postgres

networks:
  dokploy-network:
    external: true
  web:
    external: true
    ```

    **Important**: You might need to check which network `root-postgres-1` is on using:
    `docker inspect root-postgres-1 --format='{{json .NetworkSettings.Networks}}'`
    And update `default_network` in the compose file to match.

6.  **Domains**:
    *   Once deployed, go to the Service -> **Domains**.
    *   Add `n8n.jdwebsite.nl`.
    *   Port: `5678`.
    *   Secure: Yes (Let's Encrypt).

This will bring your n8n back online with all your workflows intact!
