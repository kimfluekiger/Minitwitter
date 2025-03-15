import { type Express, type Request, type Response } from 'express'
import { db } from '../database'
import { usersTable } from '../db/schema'
import authMiddleware from './auth-middleware'
import { eq } from 'drizzle-orm'
import { logger } from '../services/logger' // Logger importieren

export const initializeAdminAPI = (app: Express) => {

  // Alle Benutzer abrufen
  app.get('/api/admin/users', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /api/admin/users - Abrufen aller Benutzer')
    try {
      const users = await db.select().from(usersTable)
      logger.info(`Erfolgreich ${users.length} Benutzer geladen.`)
      res.json(users)
    } catch (error) {
      logger.error('Fehler beim Laden der Benutzer:', error)
      res.status(500).json({ error: 'Serverfehler' })
    }
  })

  // Benutzer löschen
  app.delete('/api/admin/users/:id', async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id)
    logger.debug(`DELETE /api/admin/users/${id} - Lösche Benutzer`)

    try {
      await db.delete(usersTable).where(eq(usersTable.id, id)).execute()
      logger.info(`Benutzer mit ID ${id} erfolgreich gelöscht.`)
      res.json({ message: 'Benutzer erfolgreich gelöscht' })
    } catch (error) {
      logger.error(`Fehler beim Löschen des Benutzers mit ID ${id}:`, error)
      res.status(500).json({ error: 'Serverfehler' })
    }
  })

  app.get('/api/users', async (req: Request, res: Response) => {
    logger.debug('GET /api/users - Abrufen aller Benutzer')
    try {
        const users = await db.select().from(usersTable)
        logger.info(`Erfolgreich ${users.length} Benutzer geladen.`)
        res.json(users)
    } catch (error) {
        logger.error('Fehler beim Abrufen der Benutzer:', error)
        res.status(500).json({ error: 'Serverfehler' })
    }
  })

  logger.debug('DELETE-Anfrage für Benutzer-API eingerichtet.')
  fetch(`/api/admin/users/${usersTable.id}`, {
      method: 'DELETE',
      headers: {
      'Content-Type': 'application/json',
      }
  })
}