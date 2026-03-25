#!/bin/sh
set -e
echo "Running database migrations..."
npx prisma@6.19.2 migrate deploy
echo "Seeding database..."
npx prisma@6.19.2 db seed
echo "Starting server..."
node server.js
