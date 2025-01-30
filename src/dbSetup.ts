import { Mongo } from "../shared/mongodb";
export const m = new Mongo(
  process.env.dbUri!,
  process.env.databaseName!,
  process.env.collectionName!,
  process.env.bucketName!
);
