import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { m } from "../dbSetup";

export default async function blogController(fastify: FastifyInstance) {
  fastify.get(
    "/blogs",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const blogs = await m.collection.find().toArray();
      reply.header("Content-Type", "application/json").send(blogs);
    }
  );
}
