import { Ollama } from 'ollama'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { logger } from './logger' // Logger importieren

// Test other models from ollama
// ⚠️ Not more than 7 billion parameters ⚠️
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b'

export let ollama: Ollama

export const initializeOllama = async () => {
  if (ollama) return
  logger.info('Initializing Ollama...')
  const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:12434'
  logger.info('Initializing Ollama with model: ' + OLLAMA_MODEL)
  logger.info('Using Ollama host: ' + OLLAMA_HOST)
  ollama = new Ollama({
    host: OLLAMA_HOST,
  })
  // This will pull the model from the server
  // ⚠️ Can take a few minutes ⚠️
  logger.info('Pulling model from server... This can take a few minutes')
  await ollama.pull({ model: OLLAMA_MODEL })
}

const TextAnalysisResult = z.object({
  sentiment: z.enum(['ok', 'dangerous']),
  correction: z.string(),
})

export async function textAnalysis(text: string) {
  await initializeOllama()
  logger.debug('Analyzing text: ' + text)
  const response = await ollama.chat({
    model: OLLAMA_MODEL,
    messages: [{ role: 'user', content: `Analyze the following text for harmful or wrong content: ${text}` }],
    format: zodToJsonSchema(TextAnalysisResult),
  })
  logger.info('Analysis done')
  return JSON.parse(response.message.content) as z.infer<typeof TextAnalysisResult>
}
