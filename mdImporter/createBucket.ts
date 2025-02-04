import { GridFSBucket, MongoClient } from "mongodb";
// @ts-ignore
import { traversalFiles } from "./index.ts";
import { createReadStream } from "fs";

function main() {
  const client = new MongoClient(process.env.dbUri);
  const db = client.db(process.env.databaseName);

  const bucket = new GridFSBucket(db, {
    bucketName: "visuals", // Customize bucket name (defaults to 'fs')
    chunkSizeBytes: 5 * 1024 * 1024, // Customize chunk size (default is 255KB)
  });
  const bucketPkg = new GridFSBucket(db, {
    bucketName: "pkgs", // Customize bucket name (defaults to 'fs')
    chunkSizeBytes: 5 * 1024 * 1024, // Customize chunk size (default is 255KB)
  });

  const args = process.argv.slice(2);
  const path = args[0];
  const zips = traversalFiles(path).filter((f) => f.endsWith(".zip"));
  zips.forEach((item) => {
    const fileStream = createReadStream(item);
    const uploadStream = bucketPkg.openUploadStream(item);
    fileStream
      .pipe(uploadStream)
      .on("finish", () => {
        console.log("File uploaded successfully!" + "-" + item);
      })
      .on("error", (err) => {
        console.error("Error uploading file:" + "-" + item, err);
      });
  });
}

main();
