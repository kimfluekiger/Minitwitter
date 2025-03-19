import { type Express } from 'express'
import { initializePostsAPI } from './posts'
import { initializeAuthAPI } from './auth'
import authMiddleware from './auth-middleware'
import { initializeAdminAPI } from './admin'
import { limiter } from './rate-limiter'
import { httpLogger, logger } from '../services/logger' // Logger importieren
import promMid from 'express-prometheus-middleware'

// Funktion zur Initialisierung aller API-Endpunkte
export const initializeAPI = (app: Express) => {
  // Middleware für Prometheus-Metriken zur Überwachung der API-Performance
  app.use(
    promMid({
    metricsPath: '/metrics', // Endpunkt für Prometheus-Metriken
    collectDefaultMetrics: false, // Standard-Metriken deaktivieren
    requestDurationBuckets: [0.1, 0.5, 1, 1.5], // Eimergrößen für Anfragedauer
    requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400], // Eimergrößen für Anfragelängen
    responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400], // Eimergrößen für Antwortlängen
    })
  )
  logger.debug('Prometheus metrics initialized') // Debug-Log für die Initialisierung von Prometheus
  
  logger.info('Initializing API...') // Info-Log für den Start der API-Initialisierung
  
  // HTTP-Logger aktivieren, um Anfragen und Antworten zu protokollieren
  app.use(httpLogger)
  logger.debug('HTTP request logging enabled')

  // Middleware für Authentifizierung anwenden
  app.use(authMiddleware)
  logger.debug('Auth middleware initialized')

  // Rate-Limiter zum Schutz vor Missbrauch und DDoS-Angriffen aktivieren
  app.use(limiter)
  logger.debug('Rate limiter applied')

  // API-Endpunkte für Posts initialisieren
  initializePostsAPI(app)
  logger.debug('Posts API initialized')

  // API-Endpunkte für Authentifizierung initialisieren
  initializeAuthAPI(app)
  logger.debug('Auth API initialized')

  // API-Endpunkte für Admin-Funktionen initialisieren
  initializeAdminAPI(app)
  logger.debug('Admin API initialized')

  logger.info('API successfully initialized') // Info-Log zur Bestätigung der erfolgreichen API-Initialisierung
}
