import { Configuration } from "@replikit/core/typings";

import "@replikit/vk";
import "@replikit/telegram";
import "@replikit/discord";
import "@replikit/storage";
import "@assistant-ts-client/main"

const config: Configuration = {
  vk: {
    token: process.env.VK_TOKEN!,
    pollingGroup: +process.env.VK_GROUP!
  },
  telegram: {
    token: process.env.TG_TOKEN!
  },
  discord: {
    token: process.env.DC_TOKEN!
  },
  storage: {
    connection: process.env.DB_STRING!
  }
}

export default config