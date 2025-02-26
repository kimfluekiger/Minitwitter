import { textAnalysis } from './services/ai'

const texts = ['I love Canada!', 'The earth is flat']

for (const text of texts) {
  const sentiment = await textAnalysis(text)
  console.log(text)
  console.log(sentiment)
}
