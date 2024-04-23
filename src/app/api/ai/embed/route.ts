import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { NextResponse } from 'next/server'
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb'
import { connectToDatabase, closeDatabaseConnection } from '@/app/config/database';
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  const data = request.formData()

  const file: File | null = (await data).get('file') as unknown as File
  if (!file) {
    return NextResponse.json({ message: 'Missing file input', success: false })
  }

  const fileContent = await file.text()

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  })

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const splitDocs = await textSplitter.createDocuments(fileContent.split('\n'))

  const fileId = uuidv4()
  const addedOn = new Date(Date.now()).toISOString()

  splitDocs.forEach(doc => {
    doc.metadata.file = {
      name: file.name,
      id: fileId,
      addedOn: addedOn
    }
  });

  const collection = await connectToDatabase();

  await MongoDBAtlasVectorSearch.fromDocuments(
    splitDocs,
    embeddings,
    {
      collection,
      indexName: "default",
      textKey: "text",
      embeddingKey: "embedding"
    }
  )

  await closeDatabaseConnection();

  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
