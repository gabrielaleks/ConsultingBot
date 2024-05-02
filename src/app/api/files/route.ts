import { NextResponse } from 'next/server';
import { getDatabaseConnectionToCollection } from '@/app/utils/database';
import { FilesManager } from '@/lib/types';

export async function GET() {
  let files: FilesManager.Files = {};
  try {
    const collection = await getDatabaseConnectionToCollection('embeddings');
    const results = await collection.find({}).toArray();
    results.forEach(result => {
      const { text, embedding, file } = result;
      const { name, id } = file;
      if (!files[id]) {
        files[id] = {};
      }
      if (!files[id][name]) {
        files[id][name] = [];
      }
      files[id][name].push({ text, embedding });
    });
  } catch (err) {
    console.error('Error fetching documents:', err);
    return NextResponse.json({ message: 'An error occurred during fetching of documents.' }, { status: 400 });
  }

  return NextResponse.json({
    files: files
  });
}