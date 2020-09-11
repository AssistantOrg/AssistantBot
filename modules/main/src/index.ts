import { createScope } from "@replikit/core";
import { router } from "@replikit/router";
import { fetch } from "cross-fetch";

export const logger = createScope("assistent");

const link:string = process.env.API_LINK!;

router.of("message:received").use(async context => {
  const text = context.message.text;

  if (text != null) {
    const result = await fetch(link, {
      method: 'POST',
      body: JSON.stringify({ Text: text }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (result.status != 200) {
      throw new Error("Bad response from server " + result.status);
    }
    
    const data = await result.json();
  
    console.log(data);
    context.reply(data["Text"]);
  }
});