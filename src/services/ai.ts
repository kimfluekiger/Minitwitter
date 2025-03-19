// Dies ist der Service für die AI-Integration mit Ollama.
import { Ollama } from 'ollama' // Ollama wird als AI-Modell verwendet.
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { logger } from './logger' // Logger importieren

// Das Modell für Ollama wird festgelegt und darf maximal 7 Milliarden Parameter haben.
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b'

// Die Instanz von Ollama wird hier gespeichert.
export let ollama: Ollama

// Diese Funktion initialisiert Ollama, falls es noch nicht existiert.
export const initializeOllama = async () => {
  if (ollama) return
  // Logs für die Initialisierung werden hier erstellt.
  logger.info('Initializing Ollama...')
  const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:12434'
  logger.info('Initializing Ollama with model: ' + OLLAMA_MODEL)
  logger.info('Using Ollama host: ' + OLLAMA_HOST)
  ollama = new Ollama({
    host: OLLAMA_HOST,
  })
  // Das Modell wird vom Server gezogen, was einige Minuten dauern kann.
  logger.info('Pulling model from server... This can take a few minutes')
  await ollama.pull({ model: OLLAMA_MODEL })
}

// Hier wird das Schema für das Analyseergebnis definiert.
const TextAnalysisResult = z.object({
  sentiment: z.enum(['ok', 'dangerous']),
  correction: z.string(),
})

// Diese Funktion analysiert einen Text, indem sie Ollama aufruft.
export async function textAnalysis(text: string) {
  // Sicherstellen, dass Ollama initialisiert ist.
  await initializeOllama()
  logger.debug('Analyzing text: ' + text)
  // Hier wird das AI-Modell für die Textanalyse aufgerufen.
  const response = await ollama.chat({
    model: OLLAMA_MODEL,
    messages: [{ role: 'user', content: `Analyze the following text for harmful or wrong content: ${text}` }],
    format: zodToJsonSchema(TextAnalysisResult),
  })
  logger.info('Analysis done')
  // Das Ergebnis wird in das definierte Schema umgewandelt.
  return JSON.parse(response.message.content) as z.infer<typeof TextAnalysisResult>
}
