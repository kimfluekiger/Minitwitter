// Dies ist die API für Posts in Minitwitter
import { type Express, type Request, type Response } from 'express'
// Express wird für die API-Routen benötigt
import { db } from '../database'
import { postsTable, usersTable } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import { sentimentQueue } from '../message-broker'
import { desc } from 'drizzle-orm'
import { getPosts, invalidatePostsCache, redis } from '../services/cache'
import { logger } from '../services/logger' // Logger für Logging-Zwecke importieren

export const initializePostsAPI = (app: Express) => {
  const express = require('express')

  // JSON-Parsing für eingehende Requests aktivieren
  app.use(express.json()) // Middleware für das Verarbeiten von JSON-Daten aus dem Request-Body

  // Abrufen aller Posts aus der Datenbank oder dem Cache
  app.get('/api/posts', async (req, res) => {
    logger.debug('GET /api/posts - Fetching posts')
    
    try {
      // Posts aus dem Cache abrufen, falls vorhanden
      const posts = await getPosts()
      logger.info(`Fetched ${posts.length} posts`)
      res.json(posts)
    } catch (error) {
      // Fehlerbehandlung, falls das Abrufen fehlschlägt
      logger.error('Error fetching posts:', error)
      res.status(500).send({ error: 'Failed to fetch posts' })
    }
  })

  // Erstellen eines neuen Posts durch einen authentifizierten Nutzer
  app.post('/api/posts', async (req: Request, res: Response) => {
    const userId = req.user?.id

    // Prüfen, ob der Nutzer authentifiziert ist
    if (!userId) {
      logger.warn('Unauthorized attempt to create a post')
      res.status(401).send({ error: 'Unauthorized' })
      return
    }

    const { text } = req.body
    logger.debug(`Creating new post for userId ${userId} with text: ${text}`)

    try {
      // Neuer Post wird in der Datenbank gespeichert
      const newPost = await db.insert(postsTable).values({ 
        text: text, 
        userId, 
        createdAt: new Date() 
      }).returning()

      if (!newPost[0]) {
        // Falls der Post nicht korrekt gespeichert wurde
        logger.error('Post creation failed, database returned empty response')
        res.status(500).send({ error: 'Post konnte nicht erstellt werden' })
        return
      }

      logger.info(`Post ${newPost[0].id} created by user ${userId}`)

      // Der Post wird zur Sentiment-Analyse-Queue hinzugefügt
      await sentimentQueue.add('analyze', {
        postId: newPost[0].id,
        text
      })

      // Der Cache wird nach einer Änderung invalidiert
      await invalidatePostsCache()
      
      res.send(newPost[0])
    } catch (error) {
      // Fehlerbehandlung beim Erstellen eines Posts
      logger.error('Error while creating a post:', error)
      res.status(500).send({ error: 'Failed to create post' })
    }
  })

  // Aktualisieren eines vorhandenen Posts durch den Besitzer
  app.put('/api/posts/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const userId = req.user?.id
    const { text } = req.body

    // Prüfen, ob der Nutzer authentifiziert ist
    if (!userId) {
      logger.warn(`Unauthorized attempt to update post ${id}`)
      res.status(401).send({ error: 'Unauthorized' })
      return
    }

    logger.debug(`Updating post ${id} for userId ${userId} with new text: ${text}`)

    try {
      // Aktualisieren des Posts in der Datenbank, falls der Nutzer der Besitzer ist
      const updatedPost = await db.update(postsTable)
        .set({ text })
        .where(and(eq(postsTable.id, id), eq(postsTable.userId, userId)))
        .returning()

      if (!updatedPost.length) {
        // Falls der Post nicht existiert oder nicht aktualisiert werden darf
        logger.warn(`Post ${id} not found or unauthorized update attempt by user ${userId}`)
        res.status(404).send({ error: 'Post not found or unauthorized' })
        return
      }

      logger.info(`Post ${id} updated by user ${userId}`)

      // Der Cache wird nach einer Änderung invalidiert
      await invalidatePostsCache()
      
      res.send(updatedPost[0])
    } catch (error) {
      // Fehlerbehandlung beim Aktualisieren eines Posts
      logger.error(`Error updating post ${id}:`, error)
      res.status(500).send({ error: 'Failed to update post' })
    }
  })

  // Löschen eines vorhandenen Posts durch den Besitzer
  app.delete('/api/posts/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const userId = req.user?.id

    // Prüfen, ob der Nutzer authentifiziert ist
    if (!userId) {
      logger.warn(`Unauthorized attempt to delete post ${id}`)
      res.status(401).send({ error: 'Unauthorized' })
      return
    }

    logger.debug(`Attempting to delete post ${id} for user ${userId}`)

    try {
      // Löschen des Posts aus der Datenbank, falls der Nutzer der Besitzer ist
      const deletedPost = await db.delete(postsTable)
        .where(and(eq(postsTable.id, id), eq(postsTable.userId, userId)))
        .returning()

      if (!deletedPost.length) {
        // Falls der Post nicht existiert oder nicht gelöscht werden darf
        logger.warn(`Post ${id} not found or unauthorized delete attempt by user ${userId}`)
        res.status(404).send({ error: 'Post not found or unauthorized' })
        return
      }

      logger.info(`Post ${id} deleted by user ${userId}`)

      // Der Cache wird nach einer Änderung invalidiert
      await invalidatePostsCache()
      
      res.send({ message: 'Post successfully deleted' })
    } catch (error) {
      // Fehlerbehandlung beim Löschen eines Posts
      logger.error(`Error deleting post ${id}:`, error)
      res.status(500).send({ error: 'Failed to delete post' })
    }
  })
}