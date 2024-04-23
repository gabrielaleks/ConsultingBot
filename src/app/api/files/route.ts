import { NextResponse } from 'next/server';
import { connectToDatabase, closeDatabaseConnection } from '@/app/config/database';

interface File {
  text: string;
  embedding: number[];
}

interface FileEntry {
  [key: string]: File[]
}

interface Files {
  [key: string]: FileEntry;
}

export async function GET() {
  const collection = await connectToDatabase();

  let files: Files = {};

  try {
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
  } finally {
    await closeDatabaseConnection();
  }

  return NextResponse.json({
    files: files
  });
}