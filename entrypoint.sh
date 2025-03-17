#!/bin/sh

echo "🚀 Running Drizzle migrations..."
bunx drizzle-kit push

echo "✅ Migrations complete. Starting server..."
exec bun src/app.ts
