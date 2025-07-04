import app from "./app";

const FASTIFY_PORT = Number(process.env.FASTIFY_PORT) || 3006;

console.log(`listen ${FASTIFY_PORT}`);

// @ts-ignore
app.setErrorHandler((error, request, reply) => {
  console.log(error);
  reply.status(500).send({ ok: false });
});

app.listen({ host: "0.0.0.0", port: FASTIFY_PORT });
