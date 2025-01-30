import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
// @ts-ignore
import geoip from "geoip-lite";
import { Mongo } from "../../shared/mongodb";
// @ts-ignore
import radomName from "chinese-random-name";
export default async function userController(fastify: FastifyInstance) {
  fastify.post(
    "/user",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const ip = _request.ip;

      const connection = new Mongo(
        process.env.dbUri!,
        process.env.databaseName!,
        "users",
        process.env.bucketName!
      );
      const userExists = await connection.collection.findOne({ ip: ip });
      if (userExists) {
        reply
          .header("Content-Type", "application/json")
          .send({ userInfo: userExists });
      } else {
        let location = "";
        if (ip === "::1") {
          location = "local";
        } else {
          location = geoip.lookup(ip);
        }

        const name = radomName.generate();
        connection.collection.insertOne({ ip: ip, location, name });

        reply
          .header("Content-Type", "application/json")
          .send({ userInfo: { ip: ip, location } });
      }
    }
  );
}
