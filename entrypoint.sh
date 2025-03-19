#!/bin/bash
# Dies ist das Entry-Skript für den Minitwitter-Server.

# Hier werden die Datenbankmigrationen gestartet.
echo "🚀 Running Drizzle migrations..."

# Das Drizzle-Kit wird verwendet, um die Migrationsskripte auszuführen.
bunx drizzle-kit push

# Nach erfolgreichen Migrationen wird der Server gestartet.
echo "✅ Migrations complete. Starting server..."

# Die Anwendung wird gestartet und `exec` wird verwendet, um den aktuellen Prozess durch den Serverprozess zu ersetzen.
exec bun src/app.ts