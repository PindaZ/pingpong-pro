#!/bin/sh

# Run database migrations
echo "Running database migrations..."
npx prisma db push

# Start the application
echo "Starting application..."
exec node server.js
