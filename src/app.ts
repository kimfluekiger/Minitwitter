import express, { type Request, type Response } from 'express'
import { initializeAPI } from './api'

const app = express()
app.use(express.json())

const Port = 3000


initializeAPI(app)

app.listen(Port, (err) => {
            if (err) console.log(err);
        else console.log("Server listening on PORT", Port);
    });