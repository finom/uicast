import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const VideoPlayerDef = createAIComponentDef({
  name: "VideoPlayer",
  description:
    "An HTML5 video player with controls. Renders a video element with source and configuration. Use VideoPlayer for media content, tutorials, product demos, or any video playback.",
  props: z.strictObject({
    src: z.string().meta({
      description: "Video source URL",
    }),
    poster: z.string().optional().meta({
      description: "Poster image URL shown before playback",
    }),
    autoplay: z.boolean().default(false).meta({
      description: "Whether to auto-play the video",
    }),
    muted: z.boolean().default(false).meta({
      description: "Whether to start muted",
    }),
    loop: z.boolean().default(false).meta({
      description: "Whether to loop the video",
    }),
    width: z.number().optional().meta({
      description: "Video width in pixels",
    }),
  }),
  callbacks: {
    onPlay: z
      .strictObject({})
      .meta({ description: "Callback when video starts playing" }),
    onPause: z
      .strictObject({})
      .meta({ description: "Callback when video is paused" }),
    onEnded: z
      .strictObject({})
      .meta({ description: "Callback when video ends" }),
  },
});
