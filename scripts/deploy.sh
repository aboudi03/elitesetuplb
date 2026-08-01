#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$APP_DIR"

echo "Pulling latest code..."
git pull --ff-only

echo "Installing root dependencies..."
npm ci

echo "Installing backend dependencies..."
npm --prefix server ci

echo "Generating root Prisma client..."
npx prisma generate --generator client

echo "Generating backend Prisma client..."
npm --prefix server run db:generate

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Building frontend..."
npm run build

echo "Reloading PM2 apps..."
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

echo "Deploy complete."
