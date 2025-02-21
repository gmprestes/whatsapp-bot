import { FastifyInstance } from "fastify"
import type { Message } from "@prisma/client"
import WAClient, { database } from "../../libs/whatsapp"

/**
 * This APP Just an example how to use fastify with aruga
 */

export const whatsappRoutes = (fastify: FastifyInstance, aruga: WAClient) => {
  fastify.register(
    async (instance) => {
      instance.addHook("onRequest", async (request, reply) => {
        const { token } = request.query as { token: string }
        if (!token || token !== process.env.SECRET_API) {
          reply.code(403)
          throw new Error("Unauthorized access")
        }
      })

      instance.route({
        url: "/status",
        method: "GET",
        handler: async (request, reply) => {
          if (aruga.status !== "open") {
            reply.code(500)
            throw new Error("Client not ready")
          }
          else
            return {
              message: aruga.status,
              statusCode: 200
            }
        }
      })


      // http://127.0.0.1:PORT/api/send-message?secret=yoursecret&number=628xxx&message=Hello
      instance.route({
        url: "/message/send",
        method: "GET",
        handler: async (request, reply) => {
          const { number, message } = request.query as { number: string; message: string }
          if (aruga.status !== "open") {
            reply.code(500)
            throw new Error("Client not ready")
          }

          if (number === undefined) {
            reply.code(400)
            throw new Error("The Number must be provided");
          }

          if (message === undefined) {
            reply.code(400);
            throw new Error("An Message must be provided");
          }

          const is_on_whatsapp = await aruga.onWhatsApp(number.replace(/[^0-9]/g, ""))
          if(!is_on_whatsapp[0] || !is_on_whatsapp[0].exists) {
            reply.code(400)
            throw new Error("The Number is not on WhatsApp");
          }

          const msg = await aruga.sendMessage(is_on_whatsapp[0].jid, { text: message })

          if (msg.key.id.startsWith("ARUGAZ") && msg.key.id.length === 20)
            msg.key.id = msg.key.id.replace("ARUGAZ", "GMPRESTES");

          return reply.send({
            message: msg,
            //error: "Success",
            statusCode: 200
          })
        }
      })

      instance.route({
        url: "/message/send",
        method: "POST",
        handler: async (request, reply) => {
          const { number } = request.query as { number: string; }
          const { message } = request.body as { message: string; }

          if (aruga.status !== "open") {
            reply.code(500)
            throw new Error("Client not ready")
          }

          if (number === undefined) {
            reply.code(400)
            throw new Error("The Number must be provided");
          }

          if (message === undefined || message === "") {
            reply.code(400);
            throw new Error("An Message must be provided");
          }

          const is_on_whatsapp = await aruga.onWhatsApp(number.replace(/[^0-9]/g, ""))
          if(!is_on_whatsapp[0] || !is_on_whatsapp[0].exists) {
            reply.code(400)
            throw new Error("The Number is not on WhatsApp");
          }

          const msg = await aruga.sendMessage(is_on_whatsapp[0].jid, { text: message })

          if (msg.key.id.startsWith("ARUGAZ") && msg.key.id.length === 20)
            msg.key.id = msg.key.id.replace("ARUGAZ", "GMPRESTES");

          return reply.send({
            message: msg,
            //error: "Success",
            statusCode: 200
          })
        }
      })

      instance.route({
        url: "/message/get",
        method: "GET",
        handler: async (request, reply) => {
          const { messageid } = request.query as { messageid: string; }
          if (aruga.status !== "open") {
            reply.code(500)
            throw new Error("Client not ready")
          }

          if (messageid === undefined) {
            reply.code(400)
            throw new Error("The Message ID must be provided");
          }

          const msg = await database.getMessage(messageid) as Message;

          return reply.send({
            message: msg,
            //error: "Success",
            statusCode: 200
          })
        }
      })

      instance.route({
        url: "/number/is-on-whatsapp",
        method: "GET",
        handler: async (request, reply) => {
          const { number } = request.query as { number: string;}
          if (aruga.status !== "open") {
            reply.code(500)
            throw new Error("Client not ready")
          }

          if (number === undefined) {
            reply.code(400)
            throw new Error("The Number must be provided");
          }

          const msg = await aruga.onWhatsApp(number.replace(/[^0-9]/g, ""))

          return reply.send({
            message: msg,
            //error: "Success",
            statusCode: 200
          })
        }
      })


    },
    { prefix: "/api" }
  )
}
