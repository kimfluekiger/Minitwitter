import { desc, eq } from 'drizzle-orm'
import { db } from '../database'
import { postsTable, usersTable } from '../db/schema'
import IORedis from 'ioredis'
import { logger } from '../services/logger' // Logger importieren

const CACHE_ACTIVE = (process.env.CACHE_ACTIVE || 'true') === 'true'

export let redis: IORedis

// Add initialization in app.ts
export const initializeCache = async () => {
  if (redis || !CACHE_ACTIVE) return
  logger.info('Initializing Redis Cache...')
  redis = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 100, 3000), // Versucht die Verbindung erneut
  })

  redis.on('error', (err: any) => {
    if (err.code === 'ECONNREFUSED') {
      logger.warn('⚠️ Redis-Verbindung fehlgeschlagen. Erneuter Versuch läuft...')
    } else {
      logger.error('Redis-Fehler:', err)
    }
  })

  logger.info('Redis Cache initialized')
}

type Posts = Awaited<ReturnType<typeof getPostsFromDB>>

export const getPosts = async (userId?: number) => {
  if (!CACHE_ACTIVE) {
    logger.debug('Cache ist deaktiviert, lade Daten aus der Datenbank.')
    return getPostsFromDB(userId)
  }

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

const filterPosts = (posts: Posts, userId?: number) => {
  return posts.filter(post => !userId || post.posts.userId === userId)
}

const getPostsFromCache = async (): Promise<Posts | null> => {
  const cachedPosts = await redis.get('posts')
  return cachedPosts ? JSON.parse(cachedPosts) : null
}

const getPostsFromDB = async (userId?: number) => {
  logger.debug('Hole Posts aus der Datenbank.')
  const posts = await db.select().from(postsTable).leftJoin(usersTable, eq(postsTable.userId, usersTable.id)).orderBy(desc(postsTable.createdAt))
  return posts
}

const setPostsInCache = async (posts: Posts) => {
  logger.debug('Speichere Posts im Cache.')
  await redis.set('posts', JSON.stringify(posts), 'EX', 60) // EX is the expiration time in seconds
}

export const invalidatePostsCache = async () => {
  logger.info('Invalidiere den Posts-Cache.')
  await redis.del('posts')
}
