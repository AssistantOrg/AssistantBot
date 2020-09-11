import { Configuration } from "@replikit/core/typings";

import "@replikit/vk";
import "@assistant-ts-client/main"

const config: Configuration = {
  vk: {
    token: process.env.VK_TOKEN!,
    pollingGroup: +process.env.VK_GROUP!
  },
}

export default config