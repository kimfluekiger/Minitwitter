import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { logger } from '../services/logger' // Logger importieren

// Definition der Benutzer-Payload-Struktur aus dem Token
interface UserPayload {
  id: number
  username: string
}

// Erweiterung der Express-Request-Schnittstelle um das "user"-Feld
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload // Optionales User-Objekt, falls eine Authentifizierung vorliegt
    }
  }
}

// Middleware zur Authentifizierung von Anfragen
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization // Authorization-Header auslesen
  if (!authHeader?.startsWith('Bearer ')) {
    logger.debug('Kein Auth-Header oder falsches Format, weiterleiten...')
    return next() // Falls kein Token vorhanden ist, wird die Anfrage ohne Authentifizierung fortgesetzt
  }

  const token = authHeader.split(' ')[1] // Token aus dem Header extrahieren
  try {
    logger.debug('Token erhalten, versuche zu dekodieren...')
    
    // Token dekodieren, aber ohne Überprüfung eines geheimen Schlüssels (unsicher)
    const payload = jwt.decode(token) as UserPayload | null
    if (!payload) {
      logger.warn('Token konnte nicht dekodiert werden.')
      return res.status(401).json({ error: 'Unauthorized' }) // Falls das Token ungültig ist, Zugriff verweigern
    }

    logger.info(`Token erfolgreich dekodiert für Benutzer: ${payload.username}`)
    req.user = payload // Nutzerinformationen im Request speichern
    next() // Weiterleitung zur nächsten Middleware oder Route
  } catch (error) {
    logger.error('Token verification failed:', error)
    return res.status(401).json({ error: 'Unauthorized' }) // Fehler beim Token-Handling führt zu einer 401-Antwort
  }
}

export default authMiddleware