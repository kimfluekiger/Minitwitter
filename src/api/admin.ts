import { type Express, type Request, type Response } from 'express'
import { db } from '../database'
import { usersTable } from '../db/schema'
import authMiddleware from './auth-middleware'
import { eq } from 'drizzle-orm'

export const initializeAdminAPI = (app: Express) => {

  // Alle Benutzer abrufen
  app.get('/api/admin/users', async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await db.select().from(usersTable)
      res.json(users)
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
      res.status(500).json({ error: 'Serverfehler' })
    }
  })

  // Benutzer löschen
  app.delete('/api/admin/users/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id)
      await db.delete(usersTable).where(eq(usersTable.id, id)).execute()
      res.json({ message: 'Benutzer erfolgreich gelöscht' })
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error)
      res.status(500).json({ error: 'Serverfehler' })
    }
  })

  app.get('/api/users', async (req: Request, res: Response) => {
    try {
        const users = await db.select().from(usersTable)
        res.json(users)
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzer:', error)
        res.status(500).json({ error: 'Serverfehler' })
    }
})

    fetch(`/api/admin/users/${usersTable.id}`, {
        method: 'DELETE',
        headers: {
        'Content-Type': 'application/json',
        }
})

}