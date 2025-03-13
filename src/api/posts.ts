import { type Express, type Request, type Response } from 'express'
import { db } from '../database'
import { postsTable, usersTable } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import { sentimentQueue } from '../message-broker';
import { desc } from 'drizzle-orm';
import { getPosts, invalidatePostsCache, redis } from '../services/cache';

export const initializePostsAPI = (app: Express) => {
  const express = require('express')

  app.use(express.json()) //Middleware for get JSON from the req.body (Post call)

  app.get('/api/posts', async (req, res) => {
    
    const posts = await getPosts () // 🔄 Neueste Posts zuerst
    
    
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
      createdAt: new Date() 
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
  
    // Invalidate cache after creating new post
    await invalidatePostsCache();
    
    res.send(newPost[0]);
  });

  app.put('/api/posts/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const userId = req.user?.id
    const { text } = req.body

    if (!userId) {
      res.status(401).send({ error: 'Unauthorized' })
      return
    }

    try {
      const updatedPost = await db.update(postsTable)
        .set({ text })
        .where(and(eq(postsTable.id, id), eq(postsTable.userId, userId)))
        .returning()

      if (!updatedPost.length) {
        res.status(404).send({ error: 'Post not found or unauthorized' })
        return
      }

      // Invalidate cache after updating
      await invalidatePostsCache()
      
      res.send(updatedPost[0])
    } catch (error) {
      res.status(500).send({ error: 'Failed to update post' })
    }
  })

  app.delete('/api/posts/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const userId = req.user?.id

    if (!userId) {
      res.status(401).send({ error: 'Unauthorized' })
      return
    }

    try {
      const deletedPost = await db.delete(postsTable)
        .where(and(eq(postsTable.id, id), eq(postsTable.userId, userId)))
        .returning()

      if (!deletedPost.length) {
        res.status(404).send({ error: 'Post not found or unauthorized' })
        return
      }

      // Invalidate cache after deleting
      await invalidatePostsCache()
      
      res.send({ message: 'Post successfully deleted' })
    } catch (error) {
      res.status(500).send({ error: 'Failed to delete post' })
    }
  })
}
