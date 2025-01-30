import app from "./app";

const FASTIFY_PORT = Number(process.env.FASTIFY_PORT) || 3006;

console.log(`listen ${FASTIFY_PORT}`);
app.listen({ port: FASTIFY_PORT });
