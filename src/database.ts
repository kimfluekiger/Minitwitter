import 'dotenv/config'
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './db/schema'
import { logger } from './services/logger' // Logger importieren

type DBSchema = NodePgDatabase<typeof schema>

if (!process.env.DATABASE_URL) {
    logger.warn('DATABASE_URL ist nicht gesetzt. Stelle sicher, dass die Umgebungsvariable definiert ist.')
}

logger.debug('Initialisiere die Datenbankverbindung...')
const db: DBSchema = drizzle(process.env.DATABASE_URL!)
logger.info('Datenbankverbindung erfolgreich hergestellt.')

export { db }