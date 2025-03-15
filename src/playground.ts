import { textAnalysis } from './services/ai'
import { logger } from './services/logger'

const texts = ['I love Canada!', 'The earth is flat']

for (const text of texts) {
  const sentiment = await textAnalysis(text)
  logger.info(text)
  logger.debug(sentiment)
}
