import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { db } from '../database';
import { postsTable } from '../db/schema';
import { eq } from 'drizzle-orm'

const SERVER_ROLE = process.env.SERVER_ROLE || 'all';

const redisConnection = new Redis({
  host: 'redis',
  port: 6379,
  maxRetriesPerRequest: null,
});

const sentimentQueue = new Queue<{ text: string; postId: number }>('sentiment-analysis', { connection: redisConnection });

export { sentimentQueue };

let sentimentWorker: Worker<{ text: string; postId: number }> | undefined;

async function checkContentWithOllama(text: string): Promise<{ isHateSpeech: boolean; explanation: string }> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2',
        prompt: `As a content moderator, analyze if the following text contains hate speech, discrimination, or harmful content. Respond with only "true" if it contains hate speech or "false" if it's acceptable, followed by a brief explanation after a semicolon.
        Text to analyze: "${text}"`,
        stream: false
      })
    });

    const data = await response.json();
    const [result, explanation] = data.response.split(';').map(s => s.trim());
    return {
      isHateSpeech: result.toLowerCase() === 'true',
      explanation: explanation || 'No explanation provided'
    };
  } catch (error) {
    console.error('Error calling Ollama:', error);
    return { isHateSpeech: false, explanation: 'Error analyzing content' };
  }
}

async function analyzeSentiment(text: string): Promise<string> {
  const analysis = await checkContentWithOllama(text);
  if (analysis.isHateSpeech) {
    console.log(`🚫 Hate speech detected: ${analysis.explanation}`);
    return 'hate_speech';
  }
  return 'acceptable';
}

if(SERVER_ROLE === 'all' || SERVER_ROLE === 'worker') {
  sentimentWorker = new Worker('sentiment-analysis', async (job) => {
    console.log('✅ Worker received job:', job.data);

    const sentiment = await analyzeSentiment(job.data.text);
    console.log(`🔍 Content analysis result: ${sentiment}`);

    const correction = sentiment === 'hate_speech' ? 
      'This content has been flagged as inappropriate and cannot be posted.' : null;

    await updatePostSentiment(job.data.postId, sentiment, correction);
    console.log(`✅ Post ${job.data.postId} updated with analysis result: ${sentiment}`);
  }, { connection: redisConnection });
  console.log(`Content moderation worker initialized`);
}

async function updatePostSentiment(postId: number, sentiment: string, correction: string | null) {
  console.log(`📌 Aktualisiere Post ${postId} mit Sentiment: ${sentiment} und Korrektur: ${correction}`);

  const updated = await db.update(postsTable)
    .set({ sentiment, correction })
    .where(eq(postsTable.id, postId))
    .returning();

  if (updated.length === 0) {
    console.error(`❌ Fehler: Post ${postId} konnte nicht aktualisiert werden.`);
  } else {
    console.log(`✅ Post ${postId} erfolgreich aktualisiert.`);
  }
}

export function initializeMessageBroker() {
  console.log('Initializing Message Broker...');

  if (!sentimentQueue) {
    throw new Error('Sentiment Queue konnte nicht initialisiert werden.');
  }

  console.log('Message Broker successfully initialized.');
}

console.log('Sentiment Worker gestartet...', sentimentWorker);
if (sentimentWorker) {
  console.log('Sentiment Worker gestartet...', sentimentWorker);
}
