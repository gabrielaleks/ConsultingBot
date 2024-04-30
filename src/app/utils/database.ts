import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "", {
  driverInfo: { name: "langchainjs" },
});
const dbName = 'docs';

export async function getDatabaseConnectionToCollection(collection: string) {
  await client.connect();
  return client.db(dbName).collection(collection);
}

export async function closeDatabaseConnection() {
  await client.close();
}