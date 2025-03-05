import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { db } from '../database'; // Sicherstellen, dass die DB-Verbindung importiert ist
import { postsTable } from '../db/schema'; // Dein Tabellen-Schema importieren
import { eq } from 'drizzle-orm'
import { Ollama } from 'ollama';
import { textAnalysis } from '../services/ai';


const SERVER_ROLE = process.env.SERVER_ROLE || 'all';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://ollama:11434';
const ollama = new Ollama({ host: OLLAMA_HOST });

// Verbindung zu Redis herstellen

const redisConnection = new Redis({
  host: 'redis', // Falls Redis in Docker läuft
  port: 6379,
  maxRetriesPerRequest: null,
});


const sentimentQueue = new Queue<{ text: string; postId: number }>('sentiment-analysis', { connection: redisConnection });

export { sentimentQueue };

// Worker, der Jobs verarbeitet
// Worker, der Jobs verarbeitet
const sentimentWorker = new Worker<{ text: string; postId: number }>(
  'sentiment-analysis',
  async (job) => {
    console.log('✅ Worker hat einen Job erhalten:', job.data);

    // 💡 Nutze AI, um das Sentiment zu bestimmen
    const aiResult = await textAnalysis(job.data.text);
    console.log(`🔍 AI-Analyse: Sentiment=${aiResult.sentiment}, Correction=${aiResult.correction}`);

    // Falls die AI "dangerous" als Ergebnis gibt, setzen wir es als negative Sentiment
    const sentiment = aiResult.sentiment === 'dangerous' ? 'negative' : 'neutral';
    const correction = aiResult.correction || null;

    // Post in der Datenbank aktualisieren
    await updatePostSentiment(job.data.postId, sentiment, correction);
    console.log(`✅ Post ${job.data.postId} aktualisiert mit Sentiment ${sentiment} und Korrektur: ${correction}`);
  },
  { connection: redisConnection }
);

// Sentiment-Analyse mit Ollama
async function analyzeSentiment(text: string): Promise<string> {
  console.log('🔍 Sentiment-Analyse mit Ollama für:', text);

  try {
    const response = await ollama.chat({
      model: 'llama3.2:1b', 
      messages: [{ role: 'user', content: `Analyze the sentiment of this text. Respond only with "positive", "negative", or "neutral": ${text}` }]
    });

    // Überprüfen, ob eine Antwort existiert
    if (!response || !response.message || !response.message.content) {
      console.warn('⚠️ Keine gültige Antwort von Ollama erhalten.');
      return 'neutral';
    }

    const sentiment = response.message.content.trim().toLowerCase();
    if (['positive', 'negative', 'neutral'].includes(sentiment)) {
      console.log(`✅ Ollama Sentiment-Ergebnis: ${sentiment}`);
      return sentiment;
    } else {
      console.warn('⚠️ Unerwartetes Sentiment-Ergebnis:', sentiment);
      return 'neutral';
    }
  } catch (error) {
    console.error('❌ Fehler bei der Sentiment-Analyse:', error);
    return 'neutral';
  }
}

// Funktion zur Korrektur
async function generateCorrection(text: string): Promise<string> {
  console.log('✏️ Starte Korrektur mit Ollama für:', text);

  try {
    const response = await ollama.chat({
      model: 'llama3.2:1b', // Falls du ein anderes Modell bevorzugst, hier ändern
      messages: [{ 
        role: 'user', 
        content: `Please correct the following text to be more neutral and appropriate: ${text}`
      }]
    });

    const correctedText = response.message.content.trim();
    console.log(`✅ Korrigierter Text: ${correctedText}`);
    return correctedText;
  } catch (error) {
    console.error('❌ Fehler bei der Korrektur mit Ollama:', error);
    return text; // Falls ein Fehler auftritt, geben wir den Originaltext zurück
  }
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

console.log('Sentiment Worker gestartet...', sentimentWorker);
if (sentimentWorker) {
  console.log('Sentiment Worker gestartet...', sentimentWorker);
}
