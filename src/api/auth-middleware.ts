import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

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
  if (!authHeader?.startsWith('Bearer ')) return next() // Falls kein Token vorhanden ist, weiterleiten

  const token = authHeader.split(' ')[1]
  try {
    // Token ohne festen JWT_SECRET prüfen
    const payload = jwt.decode(token) as UserPayload | null
    if (!payload) {
      console.error('Token konnte nicht dekodiert werden.')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    req.user = payload // Nutzerinformationen aus dem Token setzen
    next()
  } catch (error) {
    console.error('Token verification failed:', error)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export default authMiddleware