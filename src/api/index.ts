import { type Express } from 'express'
import { initializePostsAPI } from './posts'
import { initializeAuthAPI } from './auth'
import authMiddleware from './auth-middleware'
import { initializeAdminAPI } from './admin'
import { limiter } from './rate-limiter'
import { httpLogger, logger } from '../services/logger' // Logger importieren
import promMid from 'express-prometheus-middleware'

export const initializeAPI = (app: Express) => {
  app.use(
    promMid({
    metricsPath: '/metrics',
    collectDefaultMetrics: false,
    requestDurationBuckets: [0.1, 0.5, 1, 1.5],
    requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
    responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
    })
  )
  logger.debug('Prometheus metrics initialized')
  
  logger.info('Initializing API...')
  
  app.use(httpLogger)
  logger.debug('HTTP request logging enabled')

  app.use(authMiddleware)
  logger.debug('Auth middleware initialized')

  app.use(limiter)
  logger.debug('Rate limiter applied')

  initializePostsAPI(app)
  logger.debug('Posts API initialized')

  initializeAuthAPI(app)
  logger.debug('Auth API initialized')

  initializeAdminAPI(app)
  logger.debug('Admin API initialized')

  logger.info('API successfully initialized')
}
