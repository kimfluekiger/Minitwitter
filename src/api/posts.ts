import { type Express, type Request, type Response } from 'express'
import { db } from '../database'
import { postsTable } from '../db/schema'
import { and, eq } from 'drizzle-orm'

export const initializePostsAPI = (app: Express) => {
  const express = require('express')

  app.use(express.json()) //Middleware for get JSON from the req.body (Post call)

  app.get('/posts', async (req: Request, res: Response) => {
    const posts = await db.select().from(postsTable)
    res.send(posts)
  })

   app.post('/api/posts', async (req: Request, res: Response) => {
    const userId = req.user?.id
    if(!userId){
      res.status(401).send({error: 'Unauthotized'})
      return
    }
    const { text } = req.body
    const newPost = await db.insert(postsTable).values({text, userId}).returning()
    res.send(newPost[0])
  })

  app.put('/posts/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const updatedPost = await
      db.update(postsTable).set(req.body).where(eq(postsTable.id,
        id)).returning()
    res.send(updatedPost[0])
  })

  app.put('/api/posts/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const userId = req.user?.id
    if(!userId){
      res.status(401).send({error: 'Unauthotized'})
      return
    }
    const updatedPost = await db
      .update(postsTable)
      .set(req.body)
      .where(and(eq(postsTable.id, id),eq(postsTable.userId, userId)))
      .returning()
    res.send(updatedPost[0])
  })

  app.delete('/posts/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    db.delete(postsTable).where(eq(postsTable.id, id)).execute()
    res.send('wurde gelöscht!')
  })

  app.delete('/api/posts/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const userId = req.user?.id
    if(!userId){
      res.status(401).send({error: 'Unauthotized'})
      return
    }
    db.delete(postsTable)
      .where(and(eq(postsTable.id, id), eq(postsTable.userId, userId)))
      .execute()
    res.send('Wurde erfolgreich gelöscht!')
  })
  
}
