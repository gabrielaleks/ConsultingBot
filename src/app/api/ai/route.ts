import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabaseConnectionToCollection } from '@/app/utils/database';
import { initializeOpenAIEmbeddings, initializeChatOpenAI, initializeChatAnthropic } from '@/app/utils/model'
import { initializeMongoDBVectorStore } from '@/app/utils/vectorStore'
import { MongoDBChatMessageHistory } from '@langchain/mongodb';
import { assignRetrieverToRunnable, getRunnableWithMessageHistory, getRunnableFromProperties } from '@/app/utils/runnables';

const STANDALONE_PROMPT_TEMPLATE = `
Given a chat history and a follow-up question, rephrase the follow-up question to be a standalone question.
Do NOT answer the question, just reformulate it if needed, otherwise return it as is.
Only return the final standalone question.`

const RAG_SYSTEM_PROMPT = `
In order to help you answer questions asked by the user, you have access to extra content: {context}

You are an expert software developer AI assistant, designed to help improve and refactor code. Your task is to analyze the provided code and suggest improvements based on best practices, efficiency, readability, and maintainability. Follow these instructions carefully:

1. Analyze the following code: {question}

2. When improving the code, focus on the following aspects:
  a. Code efficiency and performance
  b. Readability and maintainability
  c. Adherence to coding standards and best practices
  d. Potential bug fixes or error handling improvements
  e. Modularization and code organization
  f. Appropriate use of design patterns (if applicable)

3. Provide your response in the following format:
  # Analysis
  Briefly describe your overall assessment of the code and the main areas for improvement.

  # Improvements
  List each suggested improvement, explaining the rationale behind it and how it benefits the code.

  # Improved Code
  Present the improved version of the code, with comments explaining significant changes.

4. Ethical considerations:
  - Do not introduce or suggest any malicious code or functionality.
  - Respect intellectual property rights and do not copy code from external sources without proper attribution.
  - Maintain the original intent and functionality of the code unless explicitly instructed otherwise.

5. Interaction instructions:
  - If you need clarification on any part of the code or improvement instructions, ask for it before proceeding with your analysis.
  - If the code is too large or complex to improve in a single response, focus on the most critical improvements and mention that further refactoring could be done in subsequent iterations.

Remember to provide thoughtful and detailed explanations for your suggested improvements, as this will help the developer understand and learn from your recommendations.
`

export async function POST(request: Request) {
  const body = await request.json()
  const bodySchema = z.object({
    prompt: z.string(),
    sessionId: z.string(),
    modelName: z.string()
  })

  const { prompt, sessionId, modelName } = bodySchema.parse(body)

  try {
    const historyCollection = await getDatabaseConnectionToCollection('history')
    const documentsCollection = await getDatabaseConnectionToCollection('embeddings')

    let model;
    if (modelName == "openai") {
      model = initializeChatOpenAI()
    } else if (modelName == "anthropic") {
      model = initializeChatAnthropic()
    } else {
      throw new Error(`Unsupported model name: ${modelName}. Please use either "openai" or "anthropic".`);
    }

    const embeddings = initializeOpenAIEmbeddings()
    const vectorStore = initializeMongoDBVectorStore(embeddings, documentsCollection)
    const retriever = vectorStore.asRetriever()

    const questionRunnable = getRunnableFromProperties(STANDALONE_PROMPT_TEMPLATE, model)
    const retrieverRunnable = assignRetrieverToRunnable(questionRunnable, retriever)
    const ragRunnable = getRunnableFromProperties(RAG_SYSTEM_PROMPT, model, retrieverRunnable)

    const chatHistory = new MongoDBChatMessageHistory({
      collection: historyCollection,
      sessionId
    })

    const RunnableWithMessageHistory = getRunnableWithMessageHistory(ragRunnable, chatHistory)

    const stream = await RunnableWithMessageHistory.stream({ question: prompt }, { configurable: { sessionId: sessionId } })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    console.log('error', error)
    return new NextResponse(JSON.stringify({ error }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}