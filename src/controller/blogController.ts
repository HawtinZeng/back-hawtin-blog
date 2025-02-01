import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Mongo } from "../../shared/mongodb";

export default async function blogController(fastify: FastifyInstance) {
  fastify.get(
    "/blogs",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const connection = new Mongo(
        process.env.dbUri!,
        process.env.databaseName!,
        process.env.collectionName!,
        process.env.bucketName!
      );

      const blogs = await connection.collection.find().toArray();
      connection.close();
      reply.header("Content-Type", "application/json").send(blogs);
    }
  );
}
