import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai'

export function initializeOpenAIEmbeddings() {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

export function initializeChatOpenAI(handlers: any) {
  return new ChatOpenAI({
    temperature: 1,
    openAIApiKey: process.env.OPENAI_API_KEY,
    streaming: true,
    modelName: 'gpt-3.5-turbo',
    callbacks: [handlers],
  });
}