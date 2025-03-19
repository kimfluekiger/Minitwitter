// Dies ist die Hauptdatei zum Starten der Minitwitter-Anwendung.
import express, { type Request, type Response } from 'express' // Express wird für die API-Servererstellung verwendet.
import { initializeAPI } from './api'
import cors from 'cors'
import { initializeMessageBroker } from './message-broker'
import { initializeCache } from './services/cache'
import { httpLogger, logger } from './services/logger'

// Die Serverrolle wird aus den Umgebungsvariablen gelesen.
const SERVER_ROLE = process.env.SERVER_ROLE || 'all'
// Diese Rollen sind gültig.
const allowedServerRoles = ['all', 'api', 'worker']
// Hier wird überprüft, ob eine ungültige Serverrolle gesetzt wurde.
if (!allowedServerRoles.includes(SERVER_ROLE)) {
    logger.error(`Invalid SERVER_ROLE: ${SERVER_ROLE}`)
    process.exit(1)
}

// Die Nachrichtenwarteschlange wird initialisiert.
logger.debug("Initializing Message Broker...")
// Die Initialisierung der Message Queue wird gestartet.
initializeMessageBroker()
logger.info("Message Broker initialized.")

// Der Cache wird initialisiert.
logger.debug("Initializing Cache...")
initializeCache()
logger.info("Cache initialized.")

// Hier wird geprüft, ob der API-Server gestartet werden soll.
if (SERVER_ROLE === 'all' || SERVER_ROLE === 'api') {
    // Die Express-App wird erstellt.
    const app = express()
    // JSON-Parsing für eingehende Anfragen wird aktiviert.
    app.use(express.json())
    // CORS wird aktiviert, um Anfragen von anderen Domains zu erlauben.
    app.use(cors())
    const Port = 3000

    // Die API-Routen werden in die Express-App integriert.
    initializeAPI(app)

    // Der Server wird auf dem definierten Port gestartet.
    app.listen(Port, (err) => {
        // Hier wird geprüft, ob der Serverstart fehlgeschlagen ist.
        if (err) logger.error("Server failed to start", err)
        // Die erfolgreiche Serverinitialisierung wird geloggt.
        else logger.info(`Server listening on PORT ${Port}`)
    })
}