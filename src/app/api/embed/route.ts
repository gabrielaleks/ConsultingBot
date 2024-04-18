import {existsSync} from 'fs';
// import {HNSWLib} from '@langchain/community/vectorstores/hnswlib'
import {OpenAIEmbeddings} from '@langchain/openai'
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter'
import {NextResponse} from 'next/server'
import {MongoDBAtlasVectorSearch} from '@langchain/mongodb'
import {MongoClient} from 'mongodb'

export async function POST(request: Request) {
  const data = request.formData()

  const file: File | null = (await data).get('file') as unknown as File
  if (!file) {
    return NextResponse.json({message: 'Missing file input', success: false})
  }

  const fileContent = await file.text()

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  })

  const splitDocs = await textSplitter.createDocuments(fileContent.split('\n'))

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "")
  const dbName = 'docs'
  const collectionName = 'embeddings'
  const collection = client.db(dbName).collection(collectionName)

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

  await client.close()
  
//   let vectorStore;
//   if (existsSync('vectorstore/rag-store.index')) {
//     vectorStore = await HNSWLib.load('vectorstore/rag-store.index', embeddings)
//     await vectorStore.addDocuments(splitDocs) 
//   } else {
//     vectorStore = await HNSWLib.fromDocuments(splitDocs, embeddings)
//   }
  
//   await vectorStore.save('vectorstore/rag-store.index')
  
  return new NextResponse(JSON.stringify({success: true}), {
    status: 200,
    headers: {'content-type': 'application/json'},
  })
}
