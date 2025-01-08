import { type Express } from 'express'
import { initializePostsAPI } from './posts'
import { initializeAuthAPI } from './auth'
import authMiddleware from './auth-middleware'


export const initializeAPI = (app: Express) => {
  app.use(authMiddleware)
  initializePostsAPI(app)
  initializeAuthAPI(app)
}
