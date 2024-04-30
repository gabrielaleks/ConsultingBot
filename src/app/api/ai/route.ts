import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabaseConnectionToCollection } from '@/app/utils/database';
import { initializeOpenAIEmbeddings, initializeChatOpenAI } from '@/app/utils/model'
import { initializeMongoDBVectorStore } from '@/app/utils/vectorStore'
import { MongoDBChatMessageHistory } from '@langchain/mongodb';
import { assignRetrieverToRunnable, getRunnableWithMessageHistory, getRunnableFromProperties } from '@/app/utils/runnables';

const STANDALONE_PROMPT_TEMPLATE = `Your knowledge is limited to context provided and to the history of the conversation.
  Use it not only to answer questions, but also to make conversations with the other person.
  Give a response in the same language as the question. Do not make stuff up!`

const RAG_SYSTEM_PROMPT = `Take into consideration, when answering the question, the following context: {context}`;

export async function POST(request: Request) {
  const body = await request.json()
  const bodySchema = z.object({
    prompt: z.string(),
  })

  const { prompt } = bodySchema.parse(body)

  try {
    const historyCollection = await getDatabaseConnectionToCollection('history')
    const documentsCollection = await getDatabaseConnectionToCollection('embeddings')
    const sessionId = 'my-session' // Should be dynamic for each user

    const model = initializeChatOpenAI()

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