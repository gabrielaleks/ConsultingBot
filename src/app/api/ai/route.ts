import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabaseConnectionToCollection } from '@/app/utils/database';
import { initializeOpenAIEmbeddings, initializeChatOpenAI } from '@/app/utils/model'
import { initializeMongoDBVectorStore } from '@/app/utils/vectorStore'
import { MongoDBChatMessageHistory } from '@langchain/mongodb';
import { assignRetrieverToRunnable, getRunnableWithMessageHistory, getRunnableFromProperties } from '@/app/utils/runnables';

const STANDALONE_PROMPT_TEMPLATE = `
Given a chat history and a follow-up question, rephrase the follow-up question to be a standalone question.
Do NOT answer the question, just reformulate it if needed, otherwise return it as is.
Only return the final standalone question.`

const RAG_SYSTEM_PROMPT = `
You are an AI bot specialized in talking with humans about day-to-day things.
Your knowledge is purely limited to the context provided and to the history of the conversation.
Do not make things up! If you do not know the answer, be honest and say that you don't know.
Give a response in the same language as the question.
Take into consideration, when answering the question, the following context: {context}`;

export async function POST(request: Request) {
  const body = await request.json()
  const bodySchema = z.object({
    prompt: z.string(),
    sessionId: z.string()
  })

  const { prompt, sessionId } = bodySchema.parse(body)

  try {
    const historyCollection = await getDatabaseConnectionToCollection('history')
    const documentsCollection = await getDatabaseConnectionToCollection('embeddings')

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