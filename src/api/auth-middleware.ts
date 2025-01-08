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
  if (!authHeader?.startsWith('Bearer ')) return next()

  const token = authHeader.split(' ')[1]
  try {
    const secretKey = process.env.JWT_SECRET!
    const payload = jwt.verify(token, secretKey) as UserPayload
    req.user = payload
  } catch {
    req.user = undefined
  }
  next()
}

export default authMiddleware
