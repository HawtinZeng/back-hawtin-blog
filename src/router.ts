import { FastifyInstance } from "fastify";
import blogController from "./controller/blogController";
import fileController from "./controller/fileController";
import userController from "./controller/users";
import commentsController from "./controller/comments";

export default async function router(fastify: FastifyInstance) {
  fastify.register(blogController);
  fastify.register(fileController);
  fastify.register(userController);
  fastify.register(commentsController);
}
