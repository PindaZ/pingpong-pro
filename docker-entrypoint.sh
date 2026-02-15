#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
node_modules/.bin/prisma migrate deploy || echo "WARNING: Migration failed, starting app anyway..."

# Start the application
echo "Starting application..."
exec node server.js
