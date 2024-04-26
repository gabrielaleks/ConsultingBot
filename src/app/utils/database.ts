import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_ATLAS_URI || '');
const dbName = 'docs';
const collectionName = 'embeddings';

export async function connectToDatabase() {
  await client.connect();
  return client.db(dbName).collection(collectionName);
}

export async function closeDatabaseConnection() {
  await client.close();
}