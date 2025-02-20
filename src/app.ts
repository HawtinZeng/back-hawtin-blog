import fastify from "fastify";
import router from "./router";
import cors from "@fastify/cors";

const server = fastify({
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== "development"),
});

// Middleware: Router
server.register(router);
server.register(cors, {
  origin: "*",
});

export default server;
