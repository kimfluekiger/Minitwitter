import express, { type Request, type Response } from 'express'
import { initializeAPI } from './api'
import cors from 'cors'

const app = express()
app.use(express.json())
app.use(cors())
const Port = 3000


initializeAPI(app)

app.listen(Port, (err) => {
            if (err) console.log(err);
        else console.log("Server listening on PORT", Port);
    });