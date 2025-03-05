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
  // 1. Check if Cache is active
  // 2. If cache active: Get posts from cache
  // 2.1 If posts are in cache, return them
  // 2.2 If posts are not in cache, get them from database
  // 2.3 Store posts in cache
  // 3. If posts are not in cache, get them directly from database
  // 4. Filter posts by userId and sentiment dangerous
  // 5. Return posts
}

const getPostsFromCache = async (): Promise<Posts | null> => {
  // Get all posts from the redis cache
  const posts = await redis.get('posts')
}

const getPostsFromDB = async () => {
  // Get all posts from the database
}
const setPostsInCache = async (posts: Posts) => {
  // Set the posts key with value in redis cache
  await redis.set('posts', JSON.stringify(posts))
}

export const invalidatePostsCache = async () => {
  // Delete the posts key from redis cache
  await redis.del('posts')
}
