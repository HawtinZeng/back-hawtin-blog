import { v4 as uuidv4 } from "uuid";
import { config } from "dotenv";
import * as fs from "fs";
import { join, sep } from "path";
import { Mongo } from "../shared/mongodb";
function main() {
  config();

  const m = new Mongo(
    process.env.dbUri,
    process.env.databaseName,
    process.env.collectionName,
    process.env.bucketName
  );

  const args = process.argv.slice(2);
  const path = args[0];
  const markdowns = traversalFiles(path).filter((f) => f.endsWith(".md"));

  const ps: Promise<any>[] = [];

  markdowns.forEach((item: string, idx) => {
    const content = fs.readFileSync(item, "utf8");
    const slices = item.split(sep);
    const title = slices[slices.length - 2];
    const regex = /\]\((?!(http|https))(.+)(\.(svg|gif|png|jpe?g))/g;

    const videoRegExp = /(?<=<video[^>]*src=["'])([^"']+)(?=["'])/g;

    const sawImg = new Map<string, string>();
    const prePath = slices.slice(0, -1).join(sep);

    const replacedVideo = content.replace(videoRegExp, (m) => {
      if (m[0] === ".") m = m.slice(2);

      let videoName: string = "";
      if (sawImg.has(m)) {
        videoName = sawImg.get(m);
      } else {
        videoName = uuidv4() + "-" + m.replaceAll("/", "-");
        sawImg.set(m, videoName);
      }

      return "/visuals/" + videoName;
    });

    const replaced = replacedVideo.replace(regex, (matched: string) => {
      let imgName: string = "";
      const slicedMatch = matched.slice(2);

      if (sawImg.has(slicedMatch)) {
        imgName = sawImg.get(slicedMatch);
      } else {
        imgName = uuidv4() + "-" + slicedMatch.replaceAll("/", "-");
        sawImg.set(slicedMatch, imgName);
      }

      return "](" + "/visuals/" + imgName;
    });

    const insert = m.collection.insertOne({
      title,
      content: replaced,
      likes: [],
      comments: [],
      createTime: new Date().getTime(),
      updateTime: new Date().getTime(),
    });

    for (const [path, withId] of sawImg.entries()) {
      const visualPath = join(prePath, path);

      const uploadPromise = new Promise((resolve, reject) => {
        const stream = fs
          .createReadStream(visualPath)
          .pipe(m.newBucket().openUploadStream(withId));
        stream.on("finish", resolve);
        stream.on("error", reject);
      });
      ps.push(uploadPromise);
    }

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
