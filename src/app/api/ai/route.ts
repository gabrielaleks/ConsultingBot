import { LangChainStream, StreamingTextResponse } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/app/utils/database';
import { initializeOpenAIEmbeddings, initializeChatOpenAI } from '@/app/utils/openAi'
import { initializeMongoDBVectorStore } from '@/app/utils/vectorStore'
import { initializeQAChainFromLLM } from '@/app/utils/chain'
import { BufferMemory } from "langchain/memory";
import { BaseMessage } from '@langchain/core/messages';

const QA_PROMPT_TEMPLATE = `You are an expert in matters related to health, well-being and how to lose weight.
  Your knowledge is limited to context provided and to the history of the conversation. Use it not only to answer questions, but also to make conversations with the other person.
  Give a response in the same language as the question. Do not make stuff up!

  Chat history : {chat_history}

  Context: {context}

  Question: {question}
  Helpful answer in markdown:`

export async function POST(request: Request) {
  const body = await request.json()
  const bodySchema = z.object({
    prompt: z.string(),
  })

  const { prompt } = bodySchema.parse(body)

  try {
    const embeddings = initializeOpenAIEmbeddings()
    const collection = await connectToDatabase()
    const vectorStore = initializeMongoDBVectorStore(embeddings, collection)
    const retriever = vectorStore.asRetriever()
    const { stream, handlers } = LangChainStream()
    const llm = initializeChatOpenAI(handlers)

    const chain = initializeQAChainFromLLM(llm, retriever, QA_PROMPT_TEMPLATE)
    chain.invoke({ question: prompt, chat_history: '' })

    return new StreamingTextResponse(stream)
  } catch (error) {
    console.log('error', error)
    return new NextResponse(JSON.stringify({ error }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}