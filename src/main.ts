import cfonts from "cfonts"
import qrcode from "qrcode"
import NodeCache from "node-cache"

import * as callHandler from "./handlers/call"
import * as groupHandler from "./handlers/group"
import * as groupParticipantHandler from "./handlers/group-participant"
import * as messageHandler from "./handlers/message"

import WAClient from "./libs/whatsapp"
import Database from "./libs/database"
import { serialize } from "./libs/whatsapp"
import { i18nInit } from "./libs/international"

import { resetUserLimit, resetUserRole } from "./utils/cron"

/** Initial Client */
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
setTimeout(() => {
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
}, 0)

/** Pretty Sexy :D */
const clearProcess = () => {
  aruga.log("Clear all process", "info")
  resetUserLimit.stop()
  resetUserRole.stop()
  Database.$disconnect()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, clearProcess)

/** Start Client */
setImmediate(async () => {
  try {
    // initialize
    await aruga.startClient()
    process.nextTick(
      () =>
        messageHandler
          .registerCommand("commands")
          .then((size) => aruga.log(`Success Register ${size} commands`))
          .catch(() => void 0),
      i18nInit()
    )

    // logs <3
    cfonts.say("Whatsapp Bot", {
      align: "center",
      colors: ["#8cf57b" as HexColor],
      font: "block",
      space: false
    })
    cfonts.say("'whatsapp-bot' By @gmprestes =)", {
      align: "center",
      font: "console",
      gradient: ["red", "#ee82f8" as HexColor]
    })
  } catch (err: unknown) {
    console.error(err)
    clearProcess()
  }
})
