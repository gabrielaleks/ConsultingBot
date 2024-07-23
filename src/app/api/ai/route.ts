import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabaseConnectionToCollection } from '@/app/utils/database';
import { initializeOpenAIEmbeddings, initializeChatOpenAI, initializeChatAnthropic } from '@/app/utils/model'
import { initializeMongoDBVectorStore } from '@/app/utils/vectorStore'
import { MongoDBChatMessageHistory } from '@langchain/mongodb';
import { assignRetrieverToRunnable, getRunnableWithMessageHistory, getRunnableFromProperties } from '@/app/utils/runnables';
import {
  GPT3_5_OPENAI_MODEL,
  GPT4_OPENAI_MODEL,
  GPT4O_OPENAI_MODEL,
  CLAUDE_3_5_SONNET_MODEL,
  CLAUDE_3_OPUS_MODEL,
  CLAUDE_3_HAIKU_MODEL
} from '@/app/utils/const';

const STANDALONE_PROMPT_TEMPLATE = `
Given a chat history and a follow-up question, rephrase the follow-up question to be a standalone question.
Do NOT answer the question, just reformulate it if needed, otherwise return it as is.
Only return the final standalone question.`

const RAG_SYSTEM_PROMPT = `
You are an AI chatbot for a software industry consulting company. You have access to a JSON file containing multiple software engineering job descriptions. Your purpose is to provide useful answers to user queries based on this data.

Here is the JSON data containing the job descriptions: {context}

To answer user queries:

1. Parse and analyze the JSON data. Pay attention to all fields, especially those highlighted as important in the task description.

2. When responding to queries, consider the following:
   - Job details (title, company, description, duration, engagement type, time commitment, geo preferences)
   - Skills
   - Salary and budget information
   - Publishing and closing dates

3. Tailor your response to the specific query. For example, if asked about jobs with a particular role, filter the data accordingly and present relevant information.

4. Format your response in a clear, organized manner. Use bullet points or numbered lists when appropriate.

5. If the query requires comparing multiple jobs, present the information in a way that facilitates easy comparison.

6. When mentioning specific jobs, always include the job title and company name.

7. If the query touches on salary or rate information, provide ranges when available.

8. If the query is ambiguous or lacks specificity, ask for clarification before providing an answer.

9. If the query cannot be answered based on the available data, politely explain why and suggest alternative information you can provide.

Here is the user's query: {question}

Please analyze the JSON data and provide a comprehensive answer to the user's query. Format your response in a clear and organized manner, using appropriate headings, bullet points, or numbered lists as needed.
`

const MAX_RETRIEVED_DOCS = 50;

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
    switch (modelName) {
      case (GPT3_5_OPENAI_MODEL):
      case (GPT4_OPENAI_MODEL):
      case (GPT4O_OPENAI_MODEL):
        model = initializeChatOpenAI(modelName);
        break
      case (CLAUDE_3_HAIKU_MODEL):
      case (CLAUDE_3_OPUS_MODEL):
      case (CLAUDE_3_5_SONNET_MODEL):
        model = initializeChatAnthropic(modelName);
        break
      default:
        throw new Error(`Unsupported model name: ${modelName}.`);
    }

    const embeddings = initializeOpenAIEmbeddings()
    const vectorStore = initializeMongoDBVectorStore(embeddings, documentsCollection)
    const retriever = vectorStore.asRetriever(MAX_RETRIEVED_DOCS)

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