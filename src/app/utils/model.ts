import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai'

export function initializeOpenAIEmbeddings() {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

export function initializeChatOpenAI() {
  return new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    openAIApiKey: process.env.OPENAI_API_KEY,
    // Between 0 and 1. Lower value are deterministic, while higher are random
    temperature: 0.5,
    // If true, tokens will be sent as server-sent events as they become available
    streaming: true,
    // Max number of tokes to be generated in chat completion
    maxTokens: 2048
  });
}