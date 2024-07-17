import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from "@langchain/anthropic";

export function initializeOpenAIEmbeddings() {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

export function initializeChatOpenAI() {
  return new ChatOpenAI({
    modelName: 'gpt-4o',
    openAIApiKey: process.env.OPENAI_API_KEY,
    // Between 0 and 1. Lower value are deterministic, while higher are random
    temperature: 0,
    // If true, tokens will be sent as server-sent events as they become available
    streaming: true,
    // Max number of tokes to be generated in chat completion
    maxTokens: 2048
  });
}

export function initializeChatAnthropic() {
  return new ChatAnthropic({
    model: 'claude-3-5-sonnet-20240620',
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0,
    maxTokens: 1024
  })
}