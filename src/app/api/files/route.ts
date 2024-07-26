import { NextResponse } from 'next/server';
import { getDatabaseConnectionToCollection } from '@/app/utils/database';
import { FilesManager } from '@/lib/types';

export async function GET() {
  let collectionOfFiles: FilesManager.Files = { files: [] };
  try {
    const collection = await getDatabaseConnectionToCollection('embeddings');
    const cursor = collection.aggregate([
      { $sort: { company: 1 } }
    ]).stream();

    for await (const result of cursor) {
      const { id, company, title } = result;
      let file: FilesManager.File = {
        id,
        company,
        jobTitle: title
      };
      collectionOfFiles.files.push(file);
    }
  } catch (err) {
    console.error('Error fetching documents:', err);
    return NextResponse.json({ message: 'An error occurred during fetching of documents.' }, { status: 400 });
  }

  return NextResponse.json({
    files: collectionOfFiles.files
  });
}