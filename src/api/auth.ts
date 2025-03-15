import { type Express, type Request, type Response } from 'express'
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { usersTable } from '../db/schema'
import { db } from '../database'
import { eq } from 'drizzle-orm'
import { logger } from '../services/logger' // Logger importieren

// 🔐 JWT Secret aus der Umgebung oder Default-Wert
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123'

// 🔧 Admin-User-Erstellung als separate Funktion
const createAdminUser = async () => {
    logger.debug('Checking for existing admin user...')
    const adminUser = await db.select().from(usersTable).where(eq(usersTable.username, 'admin'))

    if (adminUser.length === 0) {
        logger.info('🔧 Admin-User wird erstellt...')
        const passwordHash = await bcrypt.hash('admin', 10)
        await db.insert(usersTable).values({ username: 'admin', password: passwordHash, isAdmin: true })
        logger.info('✅ Admin-User erstellt! (Benutzername: admin, Passwort: admin)')
    } else {
        logger.info('✅ Admin-User existiert bereits.')
    }
}

// 🌍 Authentifizierungs-API initialisieren
export const initializeAuthAPI = async (app: Express) => {
    logger.info('Initializing authentication API...')
    await createAdminUser(); // Admin-User sicherstellen

    // 📌 Registrierung neuer User
    app.post('/api/auth/register', async (req: Request, res: Response) => {
        try {
            const { password, username } = req.body
            logger.debug(`User registration attempt for username: ${username}`)

            // Prüfen, ob der Username bereits existiert
            const existingUsers = await db.select().from(usersTable).where(eq(usersTable.username, username))
            if (existingUsers.length > 0) {
                logger.warn(`Registration failed: Username ${username} is already taken`)
                return res.status(400).json({ error: 'Benutzername bereits vergeben' })
            }

            // Passwort hashen und User speichern
            logger.debug(`Hashing password for user ${username}`)
            const passwordHash = await bcrypt.hash(password, 10)
            const newUser = await db.insert(usersTable).values({
                username,
                password: passwordHash,
                isAdmin: false // Standardmäßig kein Admin
            }).returning()

            logger.info(`User ${username} successfully registered`)
            res.json({ id: newUser[0].id, username: newUser[0].username, isAdmin: newUser[0].isAdmin })
        } catch (error) {
            logger.error('❌ Fehler bei der Registrierung:', error)
            res.status(500).json({ error: 'Serverfehler bei der Registrierung' })
        }
    })

    // 📌 Login (gibt User-ID + Admin-Status zurück)
    app.post('/api/auth/login', async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body
            logger.debug(`🔍 Login-Versuch für: ${username}`)

            const users = await db.select().from(usersTable).where(eq(usersTable.username, username))

            if (users.length === 0) {
                logger.warn(`❌ Login fehlgeschlagen: Benutzer ${username} nicht gefunden`)
                return res.status(401).json({ error: 'Invalid username or password' })
            }

            const user = users[0]
            logger.debug(`User ${username} gefunden, verifiziere Passwort...`)
            const passwordMatch = await bcrypt.compare(password, user.password)

            if (!passwordMatch) {
                logger.warn(`❌ Login fehlgeschlagen: Passwort für Benutzer ${username} falsch`)
                return res.status(401).json({ error: 'Invalid username or password' })
            }

            logger.info(`✅ Login erfolgreich für ${user.username} (Admin: ${user.isAdmin})`)

            // 🔥 Erzeuge einen echten JWT-Token
            logger.debug(`Generiere JWT-Token für Benutzer ${username}`)
            const token = jwt.sign(
                { id: user.id, username: user.username, isAdmin: user.isAdmin }, 
                JWT_SECRET, 
                { expiresIn: '1h' }
            )

            res.json({ token, isAdmin: user.isAdmin })
        } catch (error) {
            logger.error('❌ Fehler beim Login:', error)
            res.status(500).json({ error: 'Serverfehler beim Login' })
        }
    })
}