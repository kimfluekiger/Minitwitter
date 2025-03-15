import type { Request } from 'express'
import pinoHttp from 'pino-http'
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true, // Alternative zu forceColor
    },
  },
})

const httpLogger = pinoHttp({
  logger: logger,
  customProps: (req: Request, res) => {
    logger.debug(`Incoming request: ${req.method} ${req.url}`)
    return {
      userId: req.user?.id,
      username: req.user?.username,
    }
  },
})

export { logger, httpLogger }
