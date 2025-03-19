import { type Express, type Request, type Response } from 'express'
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { usersTable } from '../db/schema'
import { db } from '../database'
import { eq } from 'drizzle-orm'
import { logger } from '../services/logger' // Logger importieren

// JWT Secret aus der Umgebung oder Standardwert verwenden
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123'

// Funktion zur Erstellung eines Admin-Benutzers, falls noch keiner existiert
const createAdminUser = async () => {
    logger.debug('Prüfe, ob ein Admin-Benutzer existiert...')
    const adminUser = await db.select().from(usersTable).where(eq(usersTable.username, 'admin'))

    if (adminUser.length === 0) {
        logger.info('Erstelle Admin-Benutzer...')
        const passwordHash = await bcrypt.hash('admin', 10) // Passwort hashen
        await db.insert(usersTable).values({ username: 'admin', password: passwordHash, isAdmin: true })
        logger.info('Admin-Benutzer wurde erstellt (Benutzername: admin, Passwort: admin)')
    } else {
        logger.info('Admin-Benutzer existiert bereits.')
    }
}

// Initialisiert die Authentifizierungs-API
export const initializeAuthAPI = async (app: Express) => {
    logger.info('Starte Authentifizierungs-API...')
    await createAdminUser() // Stellt sicher, dass ein Admin-Benutzer vorhanden ist

    // Route zur Registrierung neuer Benutzer
    app.post('/api/auth/register', async (req: Request, res: Response) => {
        try {
            const { password, username } = req.body
            logger.debug(`Registrierungsversuch für Benutzer: ${username}`)

            // Überprüfung, ob der Benutzername bereits existiert
            const existingUsers = await db.select().from(usersTable).where(eq(usersTable.username, username))
            if (existingUsers.length > 0) {
                logger.warn(`Registrierung fehlgeschlagen: Benutzername ${username} bereits vergeben`)
                return res.status(400).json({ error: 'Benutzername bereits vergeben' })
            }

            // Passwort hashen und Benutzer speichern
            logger.debug(`Hashing Passwort für Benutzer ${username}`)
            const passwordHash = await bcrypt.hash(password, 10)
            const newUser = await db.insert(usersTable).values({
                username,
                password: passwordHash,
                isAdmin: false // Standardmäßig kein Admin
            }).returning()

            logger.info(`Benutzer ${username} erfolgreich registriert`)
            res.json({ id: newUser[0].id, username: newUser[0].username, isAdmin: newUser[0].isAdmin })
        } catch (error) {
            logger.error('Fehler bei der Registrierung:', error)
            res.status(500).json({ error: 'Serverfehler bei der Registrierung' }) // Fehlerbehandlung
        }
    })

    // Route für den Login (gibt User-ID + Admin-Status zurück)
    app.post('/api/auth/login', async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body
            logger.debug(`Login-Versuch für Benutzer: ${username}`)

            // Benutzer anhand des Benutzernamens abrufen
            const users = await db.select().from(usersTable).where(eq(usersTable.username, username))

            if (users.length === 0) {
                logger.warn(`Login fehlgeschlagen: Benutzer ${username} nicht gefunden`)
                return res.status(401).json({ error: 'Invalid username or password' })
            }

            const user = users[0]
            logger.debug(`Benutzer ${username} gefunden, Passwortüberprüfung läuft...`)
            const passwordMatch = await bcrypt.compare(password, user.password)

            if (!passwordMatch) {
                logger.warn(`Login fehlgeschlagen: Passwort für Benutzer ${username} ist falsch`)
                return res.status(401).json({ error: 'Invalid username or password' })
            }

            logger.info(`Login erfolgreich für ${user.username} (Admin: ${user.isAdmin})`)

            // JWT-Token erstellen
            logger.debug(`Erstelle JWT-Token für Benutzer ${username}`)
            const token = jwt.sign(
                { id: user.id, username: user.username, isAdmin: user.isAdmin }, 
                JWT_SECRET, 
                { expiresIn: '1h' } // Token läuft nach 1 Stunde ab
            )

            res.json({ token, isAdmin: user.isAdmin }) // Token und Admin-Status zurückgeben
        } catch (error) {
            logger.error('Fehler beim Login:', error)
            res.status(500).json({ error: 'Serverfehler beim Login' }) // Fehlerbehandlung
        }
    })
}