import { type Express, type Request, type Response } from 'express'
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { usersTable } from '../db/schema'
import { db } from '../database'
import { eq } from 'drizzle-orm'

// 🔐 JWT Secret aus der Umgebung oder Default-Wert
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123'

// 🔧 Admin-User-Erstellung als separate Funktion
const createAdminUser = async () => {
    const adminUser = await db.select().from(usersTable).where(eq(usersTable.username, 'admin'))

    if (adminUser.length === 0) {
        console.log('🔧 Admin-User wird erstellt...')
        const passwordHash = await bcrypt.hash('admin', 10)
        await db.insert(usersTable).values({ username: 'admin', password: passwordHash, isAdmin: true })
        console.log('✅ Admin-User erstellt! (Benutzername: admin, Passwort: admin)')
    } else {
        console.log('✅ Admin-User existiert bereits.')
    }
}

// 🌍 Authentifizierungs-API initialisieren
export const initializeAuthAPI = async (app: Express) => {
    await createAdminUser(); // Admin-User sicherstellen

    // 📌 Registrierung neuer User
    app.post('/api/auth/register', async (req: Request, res: Response) => {
        try {
            const { password, username } = req.body

            // Prüfen, ob der Username bereits existiert
            const existingUsers = await db.select().from(usersTable).where(eq(usersTable.username, username))
            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Benutzername bereits vergeben' })
            }

            // Passwort hashen und User speichern
            const passwordHash = await bcrypt.hash(password, 10)
            const newUser = await db.insert(usersTable).values({
                username,
                password: passwordHash,
                isAdmin: false // Standardmäßig kein Admin
            }).returning()

            res.json({ id: newUser[0].id, username: newUser[0].username, isAdmin: newUser[0].isAdmin })
        } catch (error) {
            console.error('❌ Fehler bei der Registrierung:', error)
            res.status(500).json({ error: 'Serverfehler bei der Registrierung' })
        }
    })

    // 📌 Login (gibt User-ID + Admin-Status zurück)
    app.post('/api/auth/login', async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body
            console.log(`🔍 Login-Versuch für: ${username}`)

            const users = await db.select().from(usersTable).where(eq(usersTable.username, username))

            if (users.length === 0) {
                console.log('❌ Login fehlgeschlagen: Benutzer nicht gefunden')
                return res.status(401).json({ error: 'Invalid username or password' })
            }

            const user = users[0]
            const passwordMatch = await bcrypt.compare(password, user.password)

            if (!passwordMatch) {
                console.log('❌ Login fehlgeschlagen: Passwort falsch')
                return res.status(401).json({ error: 'Invalid username or password' })
            }

            console.log(`✅ Login erfolgreich für ${user.username} (Admin: ${user.isAdmin})`)

            // 🔥 Erzeuge einen echten JWT-Token
            const token = jwt.sign(
                { id: user.id, username: user.username, isAdmin: user.isAdmin }, 
                JWT_SECRET, 
                { expiresIn: '1h' }
            )

            // 🔥 Admin-Status zurückgeben
            res.json({ token, isAdmin: user.isAdmin })
        } catch (error) {
            console.error('❌ Fehler beim Login:', error)
            res.status(500).json({ error: 'Serverfehler beim Login' })
        }
    })
    
}