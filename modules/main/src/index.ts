import { AttachmentType, ChannelType, createScope, TextTokenKind } from "@replikit/core";
import { MessageContext, router } from "@replikit/router";
import { fetch } from "cross-fetch";
import "@replikit/messages";
import { MessageBuilder } from "@replikit/messages";
import { userInfo } from "os";
import { HasId, Identifier } from "@replikit/core/typings";

const link:string = process.env.API_LINK!;

function getText(ctx:MessageContext) : string {
  if (ctx.message.text == null) {
    throw "bad text";
  }

  return ctx.message.text;
}

function log(ctx:MessageContext, prefix:string, text:string) {
  console.log(ctx.message.account.firstName +  " -> " + prefix + ": " + text);
}

async function sendRequest(prefix:string, data:any) : Promise<Response> {
  return await fetch(link + prefix, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

async function regUser(ctx:MessageContext) : Promise<void> {
  var result = await sendRequest("/auth/reg", { 
    Password: ctx.account.id.toString(),
    Login: ctx.account.username!,
    FirstName: ctx.account.firstName!,
    LastName: ctx.account.lastName ?? "undefined",
  });

  if (!result.ok) {
    throw "bad rsp";
  }
}

async function logUser(ctx:MessageContext) : Promise<string> {
  var result = await sendRequest("/auth/log", { 
    Password: ctx.account.id.toString(),
    Login: ctx.account.username!,
  });

  if (!result.ok) {
    throw "bad rsp";
  }

  const data = await result.text();

  return data;
}

let storage:{ id:Identifier, token:string }[] = [];
async function auth(ctx:MessageContext) : Promise<string> {
  let id = ctx.account.id;

  if (storage.some(e => e.id === id)) {
    return storage.find(e => e.id == id)!.token;
  }
  else {
    regUser(ctx);
    let token:string = await logUser(ctx);
    storage.push({ token: token, id: id });
    return token;
  }
}

async function message(text:string, isExc:boolean, token:string) : Promise<any> {
  let result = await sendRequest("/message", {
    Text: text, 
    IsNullWithoutAssistantKey: isExc,
    Token: token
  });

  if (result.status == 204) {
    return null;
  }

  if (!result.ok) {
    console.log(result.status);
    throw "bad asw";
  }

  const data = await result.json();
  return data;
}

function attachment(attachment:any, builder:MessageBuilder) : MessageBuilder {
  console.log(JSON.stringify(attachment));
  if (attachment != null)
  {
    switch (attachment.Name) {
      case "LinkAttachment":
        builder.addText("\n\n")
        builder.addToken({
          kind: TextTokenKind.Link,
          text: attachment.Text,
          url: attachment.Link,
          props: []
        });
        break;
      case "ImagesAttachment":
        attachment.Images.forEach((e:any) => {
          builder.addAttachmentByUrl(AttachmentType.Photo, e.SourceImage.Link);
        });
        break;
    }
  }
  return builder;
}

async function answer(ctx:MessageContext, data:any) : Promise<void> {
  let builder = new MessageBuilder();

  builder.addText(data.Text);

  builder = attachment(data.Attachment, builder);

  await ctx.reply(builder);
}

// route
router.of("message:received").use(async context => {
  let text:string = getText(context);
   
  log(context, "message", text);
  log(context, "storage", JSON.stringify(storage, null, "  "));

  let token:string = "";
  try {
    token = await auth(context);
  } catch (error) {
    //context.reply("#&5001");
    throw error;
  }
  
  let result = await message(text, context.channel.type != ChannelType.Direct, token);

  if (result == null) {
    return;
  }

  log(context, "storage", JSON.stringify(result));
  await answer(context, result);
});
