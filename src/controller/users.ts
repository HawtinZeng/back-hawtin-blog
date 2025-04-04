import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import geoip from "geoip-lite";
import { Mongo } from "../../shared/mongodb";
// @ts-ignore
import radomName from "chinese-random-name";
export default async function userController(fastify: FastifyInstance) {
  fastify.post(
    "/user",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const ip =
        (_request.raw.headers["x-forwarded-for"] as string) ?? _request.ip;
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
        if (ip === "127.0.0.1") {
          location = "local";
        } else {
          const loc = geoip.lookup(ip);
          location = `${loc?.country ?? "国家"}-${loc?.city ?? "城市"}`;
        }

        const name = radomName.generate();

        console.log(`insert ${ip}`);
        console.log(`name: ${name}`);

        try {
          connection.collection.insertOne({ ip: ip, location, name });
        } catch (err) {
          console.log(err);
        }

        connection.close();
        reply
          .header("Content-Type", "application/json")
          .send({ userInfo: { ip: ip, location } });
      }
    }
  );
}
