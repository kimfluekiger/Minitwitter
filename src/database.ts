// Dies ist die Datenbankverbindungsdatei für Minitwitter.
import 'dotenv/config' // Umgebungsvariablen aus der .env-Datei laden
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres' // Drizzle ORM für die PostgreSQL-Datenbank verwenden
import * as schema from './db/schema'
import { logger } from './services/logger' // Logger importieren

// Hier wird der Typ der Datenbank definiert.
type DBSchema = NodePgDatabase<typeof schema>

// Prüfen, ob die Umgebungsvariable für die Datenbankverbindung gesetzt ist.
if (!process.env.DATABASE_URL) {
    logger.warn('DATABASE_URL ist nicht gesetzt. Stelle sicher, dass die Umgebungsvariable definiert ist.')
}

// Logging für die Initialisierung der Verbindung erfolgt.
logger.debug('Initialisiere die Datenbankverbindung...')

// Hier wird die eigentliche Verbindung zur Datenbank hergestellt.
const db: DBSchema = drizzle(process.env.DATABASE_URL!)

// Das erfolgreiche Herstellen der Verbindung wird geloggt.
logger.info('Datenbankverbindung erfolgreich hergestellt.')

// Die Datenbankinstanz wird exportiert, um sie in anderen Teilen der Anwendung zu verwenden.
export { db }