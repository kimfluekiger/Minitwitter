// Dies ist der Logging-Service für Minitwitter
import type { Request } from 'express'
import pinoHttp from 'pino-http'
// Pino wird als Logging-Bibliothek verwendet.
import pino from 'pino'

// Hier wird die Logger-Instanz erstellt.
const logger = pino({
  // Das Logging-Level wird aus den Umgebungsvariablen gesetzt.
  level: process.env.LOG_LEVEL || 'debug',
  transport: {
    // Das Logging erfolgt im "pretty"-Format.
    target: 'pino-pretty',
    options: {
      // Die Konsolenausgabe wird farbig dargestellt.
      colorize: true, // Alternative zu forceColor
    },
  },
})

// Hier wird ein HTTP-Logger für eingehende Requests erstellt.
const httpLogger = pinoHttp({
  // Der HTTP-Logger verwendet dieselbe Logger-Instanz.
  logger: logger,
  customProps: (req: Request, res) => {
    // Hier wird jeder eingehende Request geloggt.
    logger.debug(`Incoming request: ${req.method} ${req.url}`)
    // Benutzerbezogene Daten werden zum Log hinzugefügt.
    return {
      userId: req.user?.id,
      username: req.user?.username,
    }
  },
})

// Die Logger-Instanzen werden exportiert, um sie in anderen Teilen der Anwendung zu verwenden.
export { logger, httpLogger }
