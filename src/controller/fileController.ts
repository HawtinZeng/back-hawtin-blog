// import * as fs from "node:fs";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Mongo } from "../../shared/mongodb";

export default async function fileController(fastify: FastifyInstance) {
  fastify.get(
    "/visuals/:name",
    // @ts-ignore
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const { name } = _request.params as any;
      let range = _request.headers["range"];
      if (!range) {
        range = "bytes 0-";
      }

      const connection = new Mongo(
        process.env.dbUri!,
        process.env.databaseName!,
        process.env.collectionName!,
        process.env.bucketName!
      );
      const b = connection.newBucket();
      const fileInfoCursor = b.find({ filename: name });
      const fileInfo = await fileInfoCursor.next();
      if (fileInfo === null) reply.status(404).send({ isOk: false });
      if ((name as string).endsWith("mp4")) {
        const video = fileInfo!;
        const videoSize = video.length;
        const CHUNK_SIZE = 0.5 * 1e6; // 0.5 M
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        console.log("end - start")
        console.log(end - start)
        
        const contentLength = end - start + 1;
        reply.headers({
          "content-range": `bytes ${start}-${end}/${videoSize}`,
          "accept-ranges": "bytes",
          "content-length": contentLength,
          "content-type": "video/mp4",
        });
        reply.code(206);
        const downloadStream = b.openDownloadStream(video._id, {
          start,
          end: end + 1, // end is not included, so we use end + 1 to include the last byte
        });
        return downloadStream;
      } else {
        const s = b.openDownloadStreamByName(name);
        s.on("error", (e) => {
          reply.status(500).send({ message: e.message, ok: false });
        }).on("end", () => {
          connection.close();
        });
        return s;
      }
    }
  );

  fastify.get(
    "/pkgs/:name",
    // @ts-ignore
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const { name } = _request.params as any;

      const connection = new Mongo(
        process.env.dbUri!,
        process.env.databaseName!,
        process.env.collectionName!,
        "pkgs"
      );
      const b = connection.newBucket();
      const s = b.openDownloadStreamByName(name);
      const fileInfoCursor = b.find({ filename: name });
      const fileInfo = await fileInfoCursor.next();
      if (fileInfo?.length) reply.header("content-length", fileInfo.length);

      s.on("error", (e) => {
        reply.status(500).send({ message: e.message, ok: false });
      }).on("end", () => {
        connection.close();
      });

      return s;
    }
  );
}
