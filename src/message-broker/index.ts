import { Job, Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'

let sentimentQueue: Queue
let sentimentWorker: Worker

export const initializeMessageBroker = () => {
  const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
  })

  sentimentQueue = new Queue('sentiment', { connection })
  sentimentWorker = new Worker('sentiment', analyzeSentiment, { connection })
  console.log('Message broker initialized')
}

const analyzeSentiment = async (job: Job) => {
  console.log(job.data)
  // 1. Generate job when new post is created with the post id (in api/posts.ts POST/PUT endpoint)
  // 2. Fetch the post from the database
  // 3. Analyze the sentiment of the post (services/ai.ts -> textAnalysis)
  // 4. Update the post with the sentiment
}

export { sentimentQueue }