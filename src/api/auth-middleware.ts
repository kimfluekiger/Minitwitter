import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { logger } from '../services/logger' // Logger importieren

interface UserPayload {
  id: number
  username: string
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload
    }
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    logger.debug('Kein Auth-Header oder falsches Format, weiterleiten...')
    return next() // Falls kein Token vorhanden ist, weiterleiten
  }

  const token = authHeader.split(' ')[1]
  try {
    logger.debug('Token erhalten, versuche zu dekodieren...')
    
    // Token ohne festen JWT_SECRET prüfen
    const payload = jwt.decode(token) as UserPayload | null
    if (!payload) {
      logger.warn('Token konnte nicht dekodiert werden.')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    logger.info(`Token erfolgreich dekodiert für Benutzer: ${payload.username}`)
    req.user = payload // Nutzerinformationen aus dem Token setzen
    next()
  } catch (error) {
    logger.error('Token verification failed:', error)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export default authMiddleware