import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Mongo } from "../../shared/mongodb";

export default async function visualsController(fastify: FastifyInstance) {
  fastify.get(
    "/visuals/:name",
    function (_request: FastifyRequest, reply: FastifyReply) {
      const { name } = _request.params as any;

      const connection = new Mongo(
        process.env.dbUri!,
        process.env.databaseName!,
        process.env.collectionName!,
        process.env.bucketName!
      );

      const b = connection.newBucket();
      const s = b.openDownloadStreamByName(name);
      s.on("end", () => {
        connection.close();
      });
      s.pipe(reply.raw);
    }
  );
}
