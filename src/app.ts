import express, { type Request, type Response } from 'express'
import { initializeAPI } from './api'
import cors from 'cors'
import { initializeMessageBroker } from './message-broker'

const SERVER_ROLE = process.env.SERVER_ROLE || 'all'
const allowedServerRoles = ['all', 'api', 'worker']
if (!allowedServerRoles.includes(SERVER_ROLE)) {
    console.error(`Invalid SERVER_ROLE: ${SERVER_ROLE}`)
    process.exit(1)
}

// For the worker server & apii queue
initializeMessageBroker()


// For the API server
if (SERVER_ROLE === 'all' || SERVER_ROLE === 'api') {
const app = express()
app.use(express.json())
app.use(cors())
const Port = 3000

initializeAPI(app)

app.listen(Port, (err) => {
            if (err) console.log(err);
        else console.log("Server listening on PORT", Port);
    });
}