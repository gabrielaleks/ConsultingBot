import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { v4 as uuidv4 } from 'uuid'
import { Document } from '@langchain/core/documents'

export async function generateSplitDocumentsFromFile(file: File) {
  const splitDocs = await splitTextIntoDocuments(file)
  const formattedSplitDocs = await formatDocuments(splitDocs, file)
  return formattedSplitDocs
}

async function splitTextIntoDocuments(file: File) {
  const fileContent = await file.text()

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  })

  const splitDocs = await textSplitter.createDocuments(fileContent.split('\n'))
  return splitDocs
}

async function formatDocuments(splitDocs: Document<Record<string, any>>[], file: File) {
  const fileId = uuidv4()
  const addedOn = new Date(Date.now()).toISOString()

  splitDocs.forEach(doc => {
    doc.metadata.file = {
      name: file.name,
      id: fileId,
      addedOn: addedOn
    }
  });

  return splitDocs
}