// @ts-ignore
import requestIp from "request-ip";
// @ts-ignore
import geoip from "geoip-lite";

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Mongo } from "../../shared/mongodb";
import { ObjectId } from "mongodb";

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

      connection.close();
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
      const { blogId } = _request.query as any;

      const comments = await connection.collection
        .aggregate([
          {
            $match: {
              blogId,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "ip",
              as: "userInfo",
            },
          },
          {
            $unwind: "$userInfo",
          },
        ])
        .toArray();

      const additionalFields = comments.map((c) => {
        c.canDel = c.author === clientIp;
        c.checked = c.likes.includes(clientIp);
        return c;
      });

      const roots: any[] = [];
      const notRootsMap = new Map();

      additionalFields.forEach((comment) => {
        if (comment.toComment.startsWith("blog")) {
          roots.push(comment);
        } else {
          const id = (comment._id as ObjectId).toString();
          notRootsMap.set(id, comment);
        }
      });

      const sortedComments: any[] = [];

      function pushChildren(child: any, destination: any[]) {
        child.comments.forEach((id: string) => {
          const c = notRootsMap.get(id);
          console.error(c);
          if (c) {
            destination.push(c);
            notRootsMap.delete(id);
            pushChildren(c, destination);
          }
        });
      }

      try {
        roots.map((r) => {
          const nestedComments = r.comments;
          sortedComments.push(r);
          nestedComments?.forEach((id: string) => {
            const child = notRootsMap.get(id);
            if (child) {
              sortedComments.push(child);
              pushChildren(child, sortedComments);
              notRootsMap.delete(id);
            }
          });
        });
      } catch (e) {
        console.log(e);
      }

      reply.send(sortedComments);
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
        if (!(comment.toComment as string).startsWith("blog")) {
          connection.collection.findOneAndUpdate(
            { _id: new ObjectId(comment.toComment) },
            {
              $pull: { comments: comment._id },
            }
          );
        } else {
          const ids = comment.comments.map((c: any) => new ObjectId(c._id));
          connection.collection.deleteMany({
            _id: { $in: ids },
          });
        }

        const info = await connection.collection.deleteOne({
          _id: new ObjectId(comment._id),
        });

        connection.close();
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

  fastify.post(
    "/like",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const connection = new Mongo(
        process.env.dbUri!,
        process.env.databaseName!,
        "comments",
        process.env.bucketName!
      );

      const { isChecked, commentId } = JSON.parse(_request.body as any);
      const clientIp = requestIp.getClientIp(_request);

      if (isChecked) {
        await connection.collection.findOneAndUpdate(
          { _id: new ObjectId(commentId) },
          { $push: { likes: clientIp } }
        );
      } else {
        await connection.collection.findOneAndUpdate(
          { _id: new ObjectId(commentId) },
          { $pull: { likes: clientIp } }
        );
      }

      connection.close();

      reply.send({ success: true });
    }
  );
}
