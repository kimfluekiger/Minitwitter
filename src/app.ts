import express, { type Request, type Response } from 'express'
import { initializeAPI } from './api'
import cors from 'cors'
import { initializeMessageBroker } from './message-broker'
import { initializeCache } from './services/cache'
import { httpLogger, logger } from './services/logger'

const SERVER_ROLE = process.env.SERVER_ROLE || 'all'
const allowedServerRoles = ['all', 'api', 'worker']
if (!allowedServerRoles.includes(SERVER_ROLE)) {
    logger.error(`Invalid SERVER_ROLE: ${SERVER_ROLE}`)
    process.exit(1)
}

// For the worker server & API queue
logger.debug("Initializing Message Broker...")
initializeMessageBroker()
logger.info("Message Broker initialized.")

// For the Cache
logger.debug("Initializing Cache...")
initializeCache()
logger.info("Cache initialized.")

// For the API server
if (SERVER_ROLE === 'all' || SERVER_ROLE === 'api') {
    const app = express()
    app.use(express.json())
    app.use(cors())
    const Port = 3000

    initializeAPI(app)

    app.listen(Port, (err) => {
        if (err) logger.error("Server failed to start", err)
        else logger.info(`Server listening on PORT ${Port}`)
    })
}