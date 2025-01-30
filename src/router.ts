import { FastifyInstance } from "fastify";
import blogController from "./controller/blogController";
import visualsController from "./controller/visualsController";
import userController from "./controller/users";
import commentsController from "./controller/comments";

export default async function router(fastify: FastifyInstance) {
  fastify.register(blogController);
  fastify.register(visualsController);
  fastify.register(userController);
  fastify.register(commentsController);
}
