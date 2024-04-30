import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai'

export function initializeOpenAIEmbeddings() {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

export function initializeChatOpenAI() {
  return new ChatOpenAI({
    temperature: 0.5,
    openAIApiKey: process.env.OPENAI_API_KEY,
    streaming: true,
    modelName: 'gpt-3.5-turbo'
  });
}