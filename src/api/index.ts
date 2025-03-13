import { type Express } from 'express'
import { initializePostsAPI } from './posts'
import { initializeAuthAPI } from './auth'
import authMiddleware from './auth-middleware'
import { initializeAdminAPI } from './admin'
import { limiter } from './rate-limiter'


export const initializeAPI = (app: Express) => {
  app.use(authMiddleware)
  app.use(limiter)
  initializePostsAPI(app)
  initializeAuthAPI(app)
  initializeAdminAPI(app)
}
