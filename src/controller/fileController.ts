import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Mongo } from "../../shared/mongodb";

export default async function fileController(fastify: FastifyInstance) {
  fastify.get(
    "/visuals/:name",
    // @ts-ignore
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const { name } = _request.params as any;
      const range = _request.headers["range"];
      if (!range) return;

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
      console.log(name);
      if ((name as string).endsWith("mp4")) {
        const totalSize = fileInfo!.length;
        const chunkSize = 1024 * 500; // 500 k

        const parts = range.replace(/bytes=/, "").split(/-|\//);
        const start = Number(parts[0]);
        let end = parts[1] === "" ? Number(chunkSize - 1) : Number(parts[1]);
        end = Math.min(start + chunkSize - 1, totalSize - 1);

        reply.headers({
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Content-Length": end - start + 1,
        });

        // Send a 206 Partial Content status code
        reply.code(206);
        reply.type("video/mp4");
        const s = b.openDownloadStreamByName(name, { start, end });
        console.log(start, end);
        s.on("error", (e) => {
          reply.status(500).send({ message: e.message, ok: false });
        }).on("end", () => {
          connection.close();
        });
        return s;
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
