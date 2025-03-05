import { desc, eq } from 'drizzle-orm'
import { db } from '../database'
import { postsTable, usersTable } from '../db/schema'
import IORedis from 'ioredis'

const CACHE_ACTIVE = (process.env.CACHE_ACTIVE || 'true') === 'true'

let redis: IORedis

// Add initialization in app.ts
export const initializeCache = async () => {
  if (redis || !CACHE_ACTIVE) return
  console.log('Initializing Redis Cache...')
  redis = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
  })
  console.log('Redis Cache initialized')
}

type Posts = Awaited<ReturnType<typeof getPostsFromDB>>

export const getPosts = async (userId?: number) => {
  if (!CACHE_ACTIVE) {
    
    return getPostsFromDB(userId)
  }

  const cachedPosts = await getPostsFromCache()
  if (cachedPosts) {
    console.log(cachedPosts)
    return filterPosts(cachedPosts, userId)
  }

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
  const posts = await db.select().from(postsTable).leftJoin(usersTable, eq(postsTable.userId, usersTable.id)).orderBy(desc(postsTable.createdAt))
  return posts
}

const setPostsInCache = async (posts: Posts) => {
  // Set the posts key with value in redis cache
  await redis.set('posts', JSON.stringify(posts))
}

export const invalidatePostsCache = async () => {
  // Delete the posts key from redis cache
  await redis.del('posts')
}
