import * as fs from "fs";
import { join, sep } from "path";
import { Mongo } from "./mongodb";
import { config } from "dotenv";
function main() {
  config();
  const m = new Mongo(
    process.env.dbUri,
    process.env.hawtinBlog,
    process.env.collectionName
  );

  const args = process.argv.slice(2);
  const path = args[0];
  const markdowns = traversalFiles(path).filter((f) => f.endsWith(".md"));

  const ps: Promise<any>[] = [];
  markdowns.forEach((item: string) => {
    const content = fs.readFileSync(item, "utf8");
    const slices = item.split(sep);
    const title = slices[slices.length - 2];

    const insert = m.collection.insertOne({
      title,
      content,
    });
    ps.push(insert);
  });
  Promise.all(ps).then(() => {
    m.close();
  });
}

function traversalFiles(path) {
  const stats = fs.statSync(path);
  if (stats.isDirectory()) {
    const files = fs.readdirSync(path);
    const filePath = files.map((f) => join(path, f));

    let filesDestination = [];
    filePath.forEach((f) => {
      const nested = traversalFiles(f);
      filesDestination = filesDestination.concat(nested);
    });

    return filesDestination;
  } else {
    return [path];
  }
}

main();
