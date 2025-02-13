import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Mongo } from "../../shared/mongodb";

export default async function fileController(fastify: FastifyInstance) {
  fastify.get(
    "/visuals/:name",
    // @ts-ignore
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const { name } = _request.params as any;

      const connection = new Mongo(
        process.env.dbUri!,
        process.env.databaseName!,
        process.env.collectionName!,
        process.env.bucketName!
      );

      const b = connection.newBucket();
      const s = b.openDownloadStreamByName(name);
      s.on("error", (e) => {
        reply.status(500).send({ message: e.message, ok: false });
      }).on("end", () => {
        connection.close();
      });
      return s;
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
