import { Collection, Db, MongoClient } from "mongodb";
export class Mongo {
  client: MongoClient;
  collection: Collection;
  database: Db;
  constructor(uri: string, dbName: string, collectionName: string) {
    this.client = new MongoClient(uri);
    this.database = this.client.db(dbName);
    this.collection = this.database.collection(collectionName);
  }
  close() {
    this.client.close();
  }
}
