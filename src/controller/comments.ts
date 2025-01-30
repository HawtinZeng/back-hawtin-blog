// @ts-ignore
import requestIp from "request-ip";
// @ts-ignore
import geoip from "geoip-lite";

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Mongo } from "../../shared/mongodb";
import { ObjectId } from "mongodb";
import { groupBy } from "lodash";
export default async function commentsController(fastify: FastifyInstance) {
  fastify.post(
    "/comment",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const connection = new Mongo(
        process.env.dbUri!,
        process.env.databaseName!,
        "comments",
        process.env.bucketName!
      );

      const clientIp = requestIp.getClientIp(_request);
      const geo = geoip.lookup(clientIp);

      const comment = JSON.parse(_request.body as any);

      const { insertedId } = await connection.collection.insertOne({
        ...comment,
        author: clientIp,
        location: geo,
        comments: [],
      });

      if (!(comment.toComment as string).startsWith("blog")) {
        await connection.collection.findOneAndUpdate(
          { _id: new ObjectId(comment.toComment) },
          { $push: { comments: insertedId.toString() } as any }
        );
      }

      reply.send({ success: true });
    }
  );
  fastify.get(
    "/comment",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const connection = new Mongo(
        process.env.dbUri!,
        process.env.databaseName!,
        "comments",
        process.env.bucketName!
      );

      const clientIp = requestIp.getClientIp(_request);
      const comments = await connection.collection
        .aggregate([
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "ip",
              as: "userInfo",
            },
          },
        ])
        .toArray();

      const deleteField = comments.map((c) => {
        c.canDel = c.author === clientIp;
        return c;
      });

      const grped = groupBy(deleteField, (i) => i.toComment);

      const rootKey = Object.keys(grped).find((k) => {
        return k.startsWith("blog");
      })!;

      const rootComments = grped[rootKey];

      rootComments.map((r) => {
        const nestedComments = r.comments;

        // nestedComments
      });

      reply.send(deleteField);
    }
  );
  fastify.delete(
    "/comment",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const connection = new Mongo(
        process.env.dbUri!,
        process.env.databaseName!,
        "comments",
        process.env.bucketName!
      );

      const clientIp = requestIp.getClientIp(_request);
      const comment = JSON.parse(_request.body as any);
      if (clientIp !== comment.author) {
        reply
          .status(501)
          .send({ success: false, message: "NO AUTHORIZATION!" });
      } else {
        const info = await connection.collection.deleteOne({
          _id: new ObjectId(comment._id),
        });
        if (info.deletedCount > 0) {
          reply.send({ success: true });
        } else {
          reply
            .status(501)
            .send({ success: false, message: "NOT FOUND DATA TO DELETE" });
        }
      }
    }
  );
}
