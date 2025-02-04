import app from "./app";

const FASTIFY_PORT = Number(process.env.FASTIFY_PORT) || 3006;

console.log(`listen ${FASTIFY_PORT}`);

// @ts-ignore
app.setErrorHandler((error, request, reply) => {
  reply.status(500).send({ ok: false });
});

app.listen({ host: "127.0.0.1", port: FASTIFY_PORT });
