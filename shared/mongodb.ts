import { Collection, Db, GridFSBucket, MongoClient } from "mongodb";
export class Mongo {
  client: MongoClient;
  collection: Collection;
  database: Db;
  bucketName: string;

  constructor(
    uri: string,
    dbName: string,
    collectionName: string,
    bucketName: string
  ) {
    this.client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 10,
      maxConnecting: 10,
    });
    this.database = this.client.db(dbName);
    this.collection = this.database.collection(collectionName);
    this.bucketName = bucketName;
  }
  close() {
    this.client.close();
  }

  newBucket() {
    return new GridFSBucket(this.database, { bucketName: this.bucketName });
  }
}
