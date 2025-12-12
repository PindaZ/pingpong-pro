#!/bin/sh

# Run database migrations
echo "Running database migrations..."
./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma

# Start the application
echo "Starting application..."
exec node server.js
