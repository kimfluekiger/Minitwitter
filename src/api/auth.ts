import { type Express, type Request, type Response } from 'express'
import bcrypt from "bcrypt"
import { usersTable } from '../db/schema'
import { db } from '../database'
import { eq } from 'drizzle-orm'
import  jwt from 'jsonwebtoken'



const jwtSecret = process.env.JWT_SECRET || 'supersecret123'

export const initializeAuthAPI = (app: Express) => {
    
    app.post('/api/auth/register', async (req: Request, res: Response) => {
        const {password,username} = req.body
        const passwordHash = await bcrypt.hash(password, 10)
        const newUser = await db.insert(usersTable).values({username, password: passwordHash}).returning()
        res.send({ id: newUser[0].id, username: newUser[0].username})
      })
    
      app.post('/api/auth/login', async (req: Request, res: Response) => {
        const {password,username} = req.body
        const existingUsers = await db.select().from(usersTable).where(eq(usersTable.username, username))
        if(!existingUsers.length){
          res.status(401).send({error: 'Invalid username or password'})
          return
          }
        const existingUser = existingUsers[0]
        const passwordMatch = await bcrypt.compare(password, existingUser.password)
          if(!passwordMatch){
            res.status(401).send({error: 'Password or Username does not exist!'})
            return
          }
        
        const token = jwt.sign({id: existingUser.id, username: existingUser.username}, jwtSecret,{expiresIn: '1h'})
        res.send(token) 
      })
    
}