import { type Express, type Request, type Response } from 'express'
import { db } from '../database'
import { postsTable, usersTable } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import { sentimentQueue } from '../message-broker';
import { desc } from 'drizzle-orm';
import { getPosts, invalidatePostsCache, redis } from '../services/cache';
import { logger } from '../services/logger'; // Logger importieren

export const initializePostsAPI = (app: Express) => {
  const express = require('express')

  app.use(express.json()) // Middleware for get JSON from the req.body (Post call)

  app.get('/api/posts', async (req, res) => {
    logger.debug('GET /api/posts - Fetching posts')
    
    try {
      const posts = await getPosts() // 🔄 Neueste Posts zuerst
      logger.info(`Fetched ${posts.length} posts`)
      res.json(posts);
    } catch (error) {
      logger.error('Error fetching posts:', error)
      res.status(500).send({ error: 'Failed to fetch posts' })
    }
  });

  app.post('/api/posts', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('Unauthorized attempt to create a post')
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const { text } = req.body;
    logger.debug(`Creating new post for userId ${userId} with text: ${text}`)

    try {
      // Speichere den neuen Post in der Datenbank mit createdAt
      const newPost = await db.insert(postsTable).values({ 
        text: text, 
        userId, 
        createdAt: new Date() 
      }).returning();

      if (!newPost[0]) {
        logger.error('Post creation failed, database returned empty response')
        res.status(500).send({ error: 'Post konnte nicht erstellt werden' });
        return;
      }

      logger.info(`Post ${newPost[0].id} created by user ${userId}`)

      // Füge den Post zur Sentiment-Queue hinzu
      await sentimentQueue.add('analyze', {
        postId: newPost[0].id,
        text
      });

      // Invalidate cache after creating new post
      await invalidatePostsCache();
      
      res.send(newPost[0]);
    } catch (error) {
      logger.error('Error while creating a post:', error)
      res.status(500).send({ error: 'Failed to create post' })
    }
  });

  app.put('/api/posts/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const userId = req.user?.id
    const { text } = req.body

    if (!userId) {
      logger.warn(`Unauthorized attempt to update post ${id}`)
      res.status(401).send({ error: 'Unauthorized' })
      return
    }

    logger.debug(`Updating post ${id} for userId ${userId} with new text: ${text}`)

    try {
      const updatedPost = await db.update(postsTable)
        .set({ text })
        .where(and(eq(postsTable.id, id), eq(postsTable.userId, userId)))
        .returning()

      if (!updatedPost.length) {
        logger.warn(`Post ${id} not found or unauthorized update attempt by user ${userId}`)
        res.status(404).send({ error: 'Post not found or unauthorized' })
        return
      }

      logger.info(`Post ${id} updated by user ${userId}`)

      // Invalidate cache after updating
      await invalidatePostsCache()
      
      res.send(updatedPost[0])
    } catch (error) {
      logger.error(`Error updating post ${id}:`, error)
      res.status(500).send({ error: 'Failed to update post' })
    }
  });

  app.delete('/api/posts/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const userId = req.user?.id

    if (!userId) {
      logger.warn(`Unauthorized attempt to delete post ${id}`)
      res.status(401).send({ error: 'Unauthorized' })
      return
    }

    logger.debug(`Attempting to delete post ${id} for user ${userId}`)

    try {
      const deletedPost = await db.delete(postsTable)
        .where(and(eq(postsTable.id, id), eq(postsTable.userId, userId)))
        .returning()

      if (!deletedPost.length) {
        logger.warn(`Post ${id} not found or unauthorized delete attempt by user ${userId}`)
        res.status(404).send({ error: 'Post not found or unauthorized' })
        return
      }

      logger.info(`Post ${id} deleted by user ${userId}`)

      // Invalidate cache after deleting
      await invalidatePostsCache()
      
      res.send({ message: 'Post successfully deleted' })
    } catch (error) {
      logger.error(`Error deleting post ${id}:`, error)
      res.status(500).send({ error: 'Failed to delete post' })
    }
  });
}