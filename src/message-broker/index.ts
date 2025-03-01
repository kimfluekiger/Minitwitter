import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { db } from '../database'; // Sicherstellen, dass die DB-Verbindung importiert ist
import { postsTable } from '../db/schema'; // Dein Tabellen-Schema importieren
import { eq } from 'drizzle-orm'

export { sentimentQueue };

// Verbindung zu Redis herstellen
const redisConnection = new Redis({
  host: 'redis', // Falls Redis in Docker läuft
  port: 6379,
  maxRetriesPerRequest: null,
});

// Erstelle die Queue für Sentiment Analysis
const sentimentQueue = new Queue('sentiment-analysis', { connection: redisConnection });

// Worker, der Jobs verarbeitet
const sentimentWorker = new Worker<{ text: string; postId: number }>(
  'sentiment-analysis',
  async (job) => {
    console.log('✅ Worker hat einen Job erhalten:', job.data);

    const sentiment = analyzeSentiment(job.data.text);
    console.log(`🔍 Analysiertes Sentiment: ${sentiment}`);

    const correction = sentiment === 'negative' ? generateCorrection(job.data.text) : null;
    console.log(`✏️ Korrekturvorschlag: ${correction ? correction : 'Keine Korrektur nötig'}`);

    // Post in der Datenbank aktualisieren
    await updatePostSentiment(job.data.postId, sentiment, correction);
    console.log(`✅ Post ${job.data.postId} aktualisiert mit Sentiment ${sentiment} und Korrektur: ${correction}`);
  },
  { connection: redisConnection }
);

// Dummy-Funktion zur Analyse
function analyzeSentiment(text: string): string {
  if (text.includes('schlecht') || text.includes('doof')) return 'negative';
  if (text.includes('super') || text.includes('toll')) return 'positive';
  return 'neutral';
}

// Dummy-Funktion zur Korrektur
function generateCorrection(text: string): string {
  return text.replace(/schlecht|doof/g, 'nicht so ideal');
}

// Funktion zum Update des Posts in der Datenbank
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

  // Stelle sicher, dass Redis und die Queue existieren
  if (!sentimentQueue) {
    throw new Error('Sentiment Queue konnte nicht initialisiert werden.');
  }

  console.log('Message Broker successfully initialized.');
}

console.log('Sentiment Worker gestartet...');

