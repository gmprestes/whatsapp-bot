import { inspect } from "util"

import qrcode from "qrcode"
import NodeCache from "node-cache"

import fastifyServer, { whatsappRoutes } from "./libs/server"
import WAClient, { serialize } from "./libs/whatsapp"
import Database from "./libs/database"
import { i18nInit } from "./libs/international"

import * as callHandler from "./handlers/call"
import * as groupHandler from "./handlers/group"
import * as groupParticipantHandler from "./handlers/group-participant"
import * as messageHandler from "./handlers/message"

import { resetUserLimit, resetUserRole } from "./utils/cron"

/** Initial Server */
const fastify = fastifyServer({
  // fastify options
  trustProxy: true
})

/** Initial Whatsapp Client */
const aruga = new WAClient({
  // auth type "single" or "multi"
  authType: "single",
  // baileys options
  generateHighQualityLinkPreview: true,
  mediaCache: new NodeCache({
    stdTTL: 60 * 5, // 5 mins
    useClones: false
  }),
  syncFullHistory: true,
  userDevicesCache: new NodeCache({
    stdTTL: 60 * 10, // 10 mins
    useClones: false
  })
})

/** Handler Event */
;(() => {
  // handle call event
  aruga.on("call", (call) =>
    serialize
      .call(aruga, call)
      .then((call) => callHandler.execute(aruga, call).catch(() => void 0))
      .catch(() => void 0)
  )

  // handle group event
  aruga.on("group", (message) =>
    serialize
      .group(aruga, message)
      .then((message) => groupHandler.execute(aruga, message).catch(() => void 0))
      .catch(() => void 0)
  )

  // handle group participants event
  aruga.on("group.participant", (message) =>
    serialize
      .groupParticipant(aruga, message)
      .then((message) => groupParticipantHandler.execute(aruga, message).catch(() => void 0))
      .catch(() => void 0)
  )

  // handle message event
  aruga.on("message", (message) =>
    serialize
      .message(aruga, message)
      .then((message) => messageHandler.execute(aruga, message).catch(() => void 0))
      .catch(() => void 0)
  )

  // handle qr code event
  aruga.on("qr", (qrCode) =>
    qrcode
      .toString(qrCode, { type: "terminal", small: true })
      .then((qrResult) => console.log(qrResult))
      .catch(() => void 0)
  )
})()

/** Pretty Sexy :D */
const clearProcess = async () => {
  aruga.log("Clear all process", "info")
  try {
    resetUserLimit.stop()
    resetUserRole.stop()
    await fastify.close()
    await Database.$disconnect()
    process.exit(0)
  } catch {
    process.exit(1)
  }
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, clearProcess)
for (const signal of ["unhandledRejection", "uncaughtException"]) process.on(signal, (reason: unknown) => aruga.log(inspect(reason, true), "error"))

/** Start Client */
setImmediate(async () => {
  try {
    /** api routes */
    whatsappRoutes(fastify, aruga)

    // initialize
    await aruga.startClient()
    await fastify.ready()

    process.nextTick(
      () =>
        // messageHandler
        //   .registerCommand("commands")
        //   .then((size) => aruga.log(`Success Register ${size} commands`))
        //   .catch((err) => {
        //     aruga.log(inspect(err, true), "error")
        //     clearProcess()
        //   }),
      fastify
        .listen({ host: "127.0.0.1", port: process.env.PORT || 3000 })
        .then((address) => aruga.log(`Server run on ${address}`))
        .catch((err) => {
          aruga.log(inspect(err, true), "error")
          clearProcess()
        }),
      i18nInit()
    )

    // logs <3
    // cfonts.say("Whatsapp Bot", {
    //   align: "center",
    //   colors: ["#8cf57b" as HexColor],
    //   font: "block",
    //   space: false
    // })
    // cfonts.say("By @gmprestes =)", {
    //   align: "center",
    //   font: "console",
    //   gradient: ["red", "#ee82f8" as HexColor]
    // })
    // cfonts.say("O Sangue de Jesus tem poder", {
    //   align: "center",
    //   font: "tiny",
    //   gradient: ["red", "#ee82f8" as HexColor]
    // })
  } catch (err: unknown) {
    aruga.log(inspect(err, true), "error")
    clearProcess()
  }
})

// const port = process.env.NODE_PORT || 3000;
// const app = express();
// const router = express.Router();

// const api_token = process.env.API_TOKEN || ((Math.random() + 1).toString(36).substring(7));
// const authMiddleware = (req, res, next) => {
//   const token = req.headers["authorization"].replace(/^Bearer\s/, '').replace(/^bearer\s/, '');
//   if (token === api_token)
//     next();
//   else
//     res.status(403).end();
// };

// router.get('/ping', async (req, res) => {
//   res.end(`PONG`);
//   // console.log(os.cpus());
//   // console.log(os.totalmem());
//   // console.log(os.freemem())

//   //res.end(`PONG \n CPU: ${os.cpus().length} | RAM: ${(os.totalmem()/1024)/1024} | Free RAM: ${(os.freemem()/1024)}`);
// });

// router.post('/message', authMiddleware, async (req, res) => {
//   const { message, to } = req.body;
//   const msg = (await aruga.sendMessage(to.endsWith('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`, { text: message }));
//   res.end(JSON.stringify({ count: 1, type: 'message', data: msg }));
// });

// router.post('/sync', authMiddleware, async (req, res) => {
//   const { time, page } = req.body;

//   const take = 10;
//   const count = await database.countMessages(time);
//   const itens = await database.findMessages(time, page, take);

//   console.log(count);

//   res.end(JSON.stringify({ count: itens.length, hasmore: (take * page < count), type: 'message-list', data: itens }));
// });


// router.get('/message/:message', authMiddleware, async (req, res) => {
//   let msg = (await aruga.sendMessage('555198438917@s.whatsapp.net', { text: req.params.message }));
//   res.end('OK --> ' + req.params.message);
// });

// router.get('/list/:message', async (req, res) => {

//   // send a list message!
//   const sections = [
//     {
//       title: "Section 1",
//       rows: [
//         { title: "Option 1", rowId: "option1" },
//         { title: "Option 2", rowId: "option2", description: "This is a description" }
//       ]
//     },
//     {
//       title: "Section 2",
//       rows: [
//         { title: "Option 3", rowId: "option3" },
//         { title: "Option 4", rowId: "option4", description: "This is a description V2" }
//       ]
//     },
//   ]

//   const listMessage = {
//     text: "This is a list",
//     footer: "nice footer, link: https://google.com",
//     title: "Amazing boldfaced list title",
//     buttonText: "Required, text on the button to view the list",
//     sections
//   }


//   let msg = (await aruga.sendMessage('555198904515@s.whatsapp.net', listMessage));
//   res.end('OK --> ' + req.params.message);
// });

// router.get('/button/:message', async (req, res) => {

//   const templateButtons = [
//     { index: 1, urlButton: { displayText: '⭐ Diga que me ama!', url: 'https://github.com/adiwajshing/Baileys' } },
//     //{ index: 2, callButton: { displayText: 'me ligue!', phoneNumber: '+55 (51) 99890 4515' } },
//     { index: 2, quickReplyButton: { displayText: 'Resposta como botão!', id: 'id-like-buttons-message' } },
//   ]

//   const buttonMessage = {
//     text: req.params.message ?? "Acesse esse menu",
//     footer: 'gmprestes',
//     templateButtons: templateButtons,
//     image: { url: 'https://www.shutterstock.com/image-illustration/elephant-zebra-skin-be-different-260nw-2135376329.jpg' }
//   }


//   let msg = (await aruga.sendMessage('555198438917@s.whatsapp.net', buttonMessage));
//   res.end('OK --> ' + req.params.message);
// });

// app.use(express.json());
// app.use('/api', router);
// app.listen(port, () => {
//   cfonts.say(`Message API listen on port ${port}\n | API TOKEN --> ${api_token}`, {
//     align: "center",
//     font: "console",
//     gradient: ["red", "#ee82f8" as HexColor]
//   })
// });
