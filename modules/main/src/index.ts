import { AttachmentType, createScope, TextTokenKind } from "@replikit/core";
import { router } from "@replikit/router";
import { fetch } from "cross-fetch";
import "@replikit/messages";
import { MessageBuilder } from "@replikit/messages";
import { type } from "os";

export const logger = createScope("assistent");

const link:string = process.env.API_LINK!;

router.of("message:received").use(async context => {
  const text = context.message.text;

  if (text != null) {
    const result = await fetch(link, {
      method: 'POST',
      body: JSON.stringify({ Text: text, IsNullWithoutAssistantKey: true }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (result.status == 204) return;
    
    if (result.status != 200) {
      throw new Error("Bad response from server " + result.status);
    }
    
    const data = await result.json();
    console.log(data);
    const attachment = data.Attachment;

    var builder = new MessageBuilder()
      .addText(data.Text);

    //builder.addAttachmentByUrl(AttachmentType.Video, "https://romanflx.000webhostapp.com/video_6.mp4");

    //builder.addAttachmentByUrl(AttachmentType.Photo, "https://i.ytimg.com/vi/et4xUWhz0X0/maxresdefault.jpg");

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
            builder.addAttachmentByUrl(AttachmentType.Photo, e.ImageLink);
          });
          break;
      }
    }
    context.reply(builder);
  }
});