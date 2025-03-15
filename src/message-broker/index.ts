import { Queue, Worker } from 'bullmq';
import { config } from 'dotenv';
import { Redis } from 'ioredis';
import { db } from '../database'; // Sicherstellen, dass die DB-Verbindung importiert ist
import { postsTable } from '../db/schema'; // Dein Tabellen-Schema importieren
import { eq } from 'drizzle-orm'
import { Ollama } from 'ollama';
import { textAnalysis } from '../services/ai';
import { logger } from '../services/logger'; // Logger importieren

config();
const SERVER_ROLE = process.env.SERVER_ROLE || 'all';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://ollama:11434';
const ollama = new Ollama({ host: OLLAMA_HOST });

// Verbindung zu Redis herstellen
logger.debug("Stelle Verbindung zu Redis her...");

const redisConnection = new Redis({
  host: 'redis', // Falls Redis in Docker läuft
  port: 6379,
  maxRetriesPerRequest: null,
});

const sentimentQueue = new Queue<{ text: string; postId: number }>('sentiment-analysis', { connection: redisConnection });
logger.info('✅ Sentiment Queue initialized');

export { sentimentQueue };

if (SERVER_ROLE === 'all' || SERVER_ROLE === 'worker') {
  logger.info('🛠️ Server ist ein Worker, starte Sentiment-Worker...');

  const sentimentWorker = new Worker<{ text: string; postId: number }>(
    'sentiment-analysis',
    async (job) => {
      logger.debug(`✅ Worker hat einen Job erhalten: ${JSON.stringify(job.data)}`);

      // 💡 Nutze AI, um das Sentiment zu bestimmen
      const aiResult = await textAnalysis(job.data.text);
      logger.info(`🔍 AI-Analyse: Sentiment=${aiResult.sentiment}, Correction=${aiResult.correction}`);

      // Falls die AI "dangerous" als Ergebnis gibt, setzen wir es als negative Sentiment
      const sentiment = aiResult.sentiment === 'dangerous' ? 'negative' : 'neutral';
      const correction = aiResult.correction || null;

      // Post in der Datenbank aktualisieren
      await updatePostSentiment(job.data.postId, sentiment, correction);
      logger.info(`✅ Post ${job.data.postId} aktualisiert mit Sentiment ${sentiment} und Korrektur: ${correction}`);
    },
    { connection: redisConnection }
  );

  logger.info('✅ Sentiment Worker initialized');
}

// Sentiment-Analyse mit Ollama
async function analyzeSentiment(text: string): Promise<string> {
  logger.debug(`🔍 Sentiment-Analyse mit Ollama für: ${text}`);

  try {
    const response = await ollama.chat({
      model: 'llama3.2:1b', 
      messages: [{ role: 'user', content: `Analyze the sentiment of this text. Respond only with "positive", "negative", or "neutral": ${text}` }]
    });

    // Überprüfen, ob eine Antwort existiert
    if (!response || !response.message || !response.message.content) {
      logger.warn('⚠️ Keine gültige Antwort von Ollama erhalten.');
      return 'neutral';
    }

    const sentiment = response.message.content.trim().toLowerCase();
    if (['positive', 'negative', 'neutral'].includes(sentiment)) {
      logger.info(`✅ Ollama Sentiment-Ergebnis: ${sentiment}`);
      return sentiment;
    } else {
      logger.warn(`⚠️ Unerwartetes Sentiment-Ergebnis: ${sentiment}`);
      return 'neutral';
    }
  } catch (error) {
    logger.error('❌ Fehler bei der Sentiment-Analyse:', error);
    return 'neutral';
  }
}

// Funktion zur Korrektur
async function generateCorrection(text: string): Promise<string> {
  logger.debug(`✏️ Starte Korrektur mit Ollama für: ${text}`);

  try {
    const response = await ollama.chat({
      model: 'llama3.2:1b', // Falls du ein anderes Modell bevorzugst, hier ändern
      messages: [{ 
        role: 'user', 
        content: `Please correct the following text to be more neutral and appropriate: ${text}`
      }]
    });

    const correctedText = response.message.content.trim();
    logger.info(`✅ Korrigierter Text: ${correctedText}`);
    return correctedText;
  } catch (error) {
    logger.error('❌ Fehler bei der Korrektur mit Ollama:', error);
    return text; // Falls ein Fehler auftritt, geben wir den Originaltext zurück
  }
}

// Funktion zum Update des Posts in der Datenbank
async function updatePostSentiment(postId: number, sentiment: string, correction: string | null) {
  logger.info(`📌 Aktualisiere Post ${postId} mit Sentiment: ${sentiment} und Korrektur: ${correction}`);

  const updated = await db.update(postsTable)
    .set({ sentiment, correction })
    .where(eq(postsTable.id, postId))
    .returning();

  if (updated.length === 0) {
    logger.error(`❌ Fehler: Post ${postId} konnte nicht aktualisiert werden.`);
  } else {
    logger.info(`✅ Post ${postId} erfolgreich aktualisiert.`);
  }
}

export function initializeMessageBroker() {
  logger.info('Initializing Message Broker...');

  // Stelle sicher, dass Redis und die Queue existieren
  if (!sentimentQueue) {
    throw new Error('Sentiment Queue konnte nicht initialisiert werden.');
  }

  logger.info('Message Broker successfully initialized.');
}
