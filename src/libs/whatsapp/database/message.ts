import type { Message } from "@prisma/client"
import NodeCache from "node-cache"
// import { database } from ".."
import Database from "../../../libs/database"
//import config from "../../../utils/config"

const message = new NodeCache({
  stdTTL: 60 * 10, // 10 mins
  useClones: false
})

export const getMessage = async (messageId: string) => {
  try {
    if (message.has(messageId)) return message.get(messageId) as Message

    const messageData = await Database.message.findUnique({
      where: { messageId }
    })

    if (messageData) message.set(messageId, messageData)

    return messageData
  } catch {
    return null
  }
}

export const createMessage = async (messageId: string, metadata: Partial<Omit<Message, "id" | "messageId" | "reply">>) => {
  try {

    if (message.has(messageId)) return message.get(messageId) as Message

    const messageData = await Database.message.create({
      data: {
        messageId,
        ...metadata,
        from: metadata.from ?? "",
      }
    })

    if (messageData) message.set(messageId, messageData)

    return messageData
  } catch (e) {
    console.log(e);
    return null
  }
}

export const updateMessage = async (messageId: string, metadata: Partial<Omit<Message, "id" | "messageId" | "reply">>) => {
  try {
    const messageData = await Database.message.update({
      where: { messageId },
      data: { ...metadata }
    })

    if (messageData) message.set(messageId, messageData)

    return messageData
  } catch {
    return null
  }
}

export const upsertMessage = async (messageId: string, metadata: Partial<Omit<Message, "id" | "messageId" | "reply">>) => {
  try {

    const messageData = await Database.message.upsert({
      where: { messageId },
      update: {
        messageId,
        ...metadata,
        from: metadata.from ?? ""
      },
      create: {
        messageId,
        ...metadata,
        from: metadata.from ?? ""
      }
    })

    if (messageData) message.set(messageId, messageData)

    return messageData
  } catch {
    return null
  }
}


export const deleteMessage = async (messageId: string) => {
  try {
    if (message.has(messageId)) message.del(messageId)

    return await Database.message.delete({ where: { messageId } })
  } catch {
    return null
  }
}

export const findMessages = async (lastTimestamps: number, page?: number, take?: number) => {
  try {

    page = page || 1;
    if (page <= 0)
      page = 1;
    take = take || 50;

    const query = {
      timestamps: {
        gte: lastTimestamps,
      },
    };

    return await Database.message.findMany({
      skip: take * page - 1,
      take: take,
      where: query,
      orderBy: {
        timestamps: 'desc',
      }
    })

  } catch (e) {
    console.log(e);
    return null
  }
}

export const countMessages = async (lastTimestamps: number) => {
  try {
    const query = {
      timestamps: {
        gte: lastTimestamps,
      },
    };

    const aggregate = await Database.message.aggregate({
      _count: {
        timestamps: true,
      },
      where: query,
      orderBy: {
        timestamps: 'desc',
      }
    });

    return aggregate._count.timestamps;

  } catch (e) {
    console.log(e);
    return null
  }
}


