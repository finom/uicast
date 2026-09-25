import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const VideoPlayerDef = createComponentDefinition({
  name: "VideoPlayer",
  description:
    "An HTML5 video player with controls. Renders a video element with source and configuration. Use VideoPlayer for media content, tutorials, product demos, or any video playback.",
  props: z.strictObject({
    src: z.string().meta({
      format: "uri-reference",
      description: "Video source URL",
    }),
    poster: z.string().optional().meta({
      format: "uri-reference",
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
    width: z.number().int().positive().optional().meta({
      description: "Video width in pixels",
    }),
  }),
  callbacks: {
    onPlay: z.null().meta({ description: "Callback when video starts playing" }),
    onPause: z.null().meta({ description: "Callback when video is paused" }),
    onEnded: z.null().meta({ description: "Callback when video ends" }),
  },
});
