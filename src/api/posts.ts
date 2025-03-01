import { type Express, type Request, type Response } from 'express'
import { db } from '../database'
import { postsTable, usersTable } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import { sentimentQueue } from '../message-broker';
import { desc } from 'drizzle-orm';

export const initializePostsAPI = (app: Express) => {
  const express = require('express')

  app.use(express.json()) //Middleware for get JSON from the req.body (Post call)

  app.get('/api/posts', async (req, res) => {
    const posts = await db
      .select({
        id: postsTable.id,
        text: postsTable.text,
        sentiment: postsTable.sentiment,
        correction: postsTable.correction,
        userId: postsTable.userId,
        username: usersTable.username,
        createdAt: postsTable.createdAt  // 🕒 Zeitstempel hinzufügen
      })
      .from(postsTable)
      .leftJoin(usersTable, eq(postsTable.userId, usersTable.id))
      .orderBy(desc(postsTable.createdAt)); // 🔄 Neueste Posts zuerst
    res.json(posts);
  });

  app.post('/api/posts', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }
  
    const { text } = req.body;
  
    // Speichere den neuen Post in der Datenbank mit createdAt
    const newPost = await db.insert(postsTable).values({ 
      text: text, 
      userId, 
      createdAt: new Date() // 🕒 Setze den Zeitstempel manuell
    }).returning();
    
    if (!newPost[0]) {
      res.status(500).send({ error: 'Post konnte nicht erstellt werden' });
      return;
    }
  
    // Füge den Post zur Sentiment-Queue hinzu
    await sentimentQueue.add('analyze', {
      postId: newPost[0].id,
      text
    });
  
    res.send(newPost[0]);
  });

  app.put('/api/posts/:id', async (req: Request, res: Response) => {
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

  app.delete('/api/posts/:id', async (req: Request, res: Response) => {
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
