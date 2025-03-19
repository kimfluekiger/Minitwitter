// Dies ist der Cache-Service für Minitwitter.
import { desc, eq } from 'drizzle-orm' // Drizzle ORM für die Datenbankabfragen verwenden
import { db } from '../database'
import { postsTable, usersTable } from '../db/schema'
import IORedis from 'ioredis' // IORedis für die Redis-Cache-Integration nutzen
import { logger } from '../services/logger' // Logger importieren

// Diese Konstante steuert, ob der Cache aktiviert ist oder nicht.
const CACHE_ACTIVE = (process.env.CACHE_ACTIVE || 'true') === 'true'

// Hier wird die Redis-Instanz gespeichert.
export let redis: IORedis

// Diese Funktion initialisiert die Redis-Verbindung.
export const initializeCache = async () => {
  if (redis || !CACHE_ACTIVE) return
  logger.info('Initializing Redis Cache...')
  redis = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 100, 3000), // Versucht die Verbindung erneut
  })

  // Fehler in der Redis-Verbindung werden hier behandelt.
  redis.on('error', (err: any) => {
    if (err.code === 'ECONNREFUSED') {
      logger.warn('⚠️ Redis-Verbindung fehlgeschlagen. Erneuter Versuch läuft...')
    } else {
      logger.error('Redis-Fehler:', err)
    }
  })

  logger.info('Redis Cache initialized')
}

// Diese Funktion lädt die Posts entweder aus dem Cache oder der Datenbank.
export const getPosts = async (userId?: number) => {
  if (!CACHE_ACTIVE) {
    logger.debug('Cache ist deaktiviert, lade Daten aus der Datenbank.')
    return getPostsFromDB(userId)
  }

  // Zuerst wird geprüft, ob die Daten im Cache vorhanden sind.
  logger.debug('Versuche, Posts aus dem Cache zu laden.')
  const cachedPosts = await getPostsFromCache()
  if (cachedPosts) {
    logger.info('Posts erfolgreich aus dem Cache geladen.')
    logger.debug(`Cached Posts: ${JSON.stringify(cachedPosts)}`)
    return filterPosts(cachedPosts, userId)
  }

  logger.info('Keine gecachten Posts gefunden, lade aus der Datenbank.')
  const posts = await getPostsFromDB(userId)
  await setPostsInCache(posts)
  return filterPosts(posts, userId)
}

// Diese Funktion filtert Posts nach Nutzer-ID.
const filterPosts = (posts: Posts, userId?: number) => {
  return posts.filter(post => !userId || post.posts.userId === userId)
}

// Diese Funktion liest die Posts aus Redis.
const getPostsFromCache = async (): Promise<Posts | null> => {
  const cachedPosts = await redis.get('posts')
  return cachedPosts ? JSON.parse(cachedPosts) : null
}

// Hier werden die Posts aus der Datenbank geladen, falls sie nicht im Cache sind.
const getPostsFromDB = async (userId?: number) => {
  logger.debug('Hole Posts aus der Datenbank.')
  const posts = await db.select().from(postsTable).leftJoin(usersTable, eq(postsTable.userId, usersTable.id)).orderBy(desc(postsTable.createdAt))
  return posts
}

// Diese Funktion speichert die Posts im Cache.
const setPostsInCache = async (posts: Posts) => {
  logger.debug('Speichere Posts im Cache.')
  await redis.set('posts', JSON.stringify(posts), 'EX', 60) // EX is the expiration time in seconds
}

// Diese Funktion löscht den Cache, wenn neue Posts erstellt, aktualisiert oder gelöscht werden.
export const invalidatePostsCache = async () => {
  logger.info('Invalidiere den Posts-Cache.')
  await redis.del('posts')
}
