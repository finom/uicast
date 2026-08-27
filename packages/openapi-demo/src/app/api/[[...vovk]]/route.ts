import { initSegment } from "vovk";
import ConnectionController from "@/modules/connection/connection-controller";
import ChatController from "@/modules/chat/chat-controller";
import GenerationController from "@/modules/generation/generation-controller";
import ToolController from "@/modules/tool/tool-controller";

// The demo's whole API. Because these are Vovk controllers, `vovk generate`
// emits both a typed RPC client and an OpenAPI document for them — which means
// the app can connect to itself as an API like any other.
const controllers = {
  ConnectionController,
  ToolController,
  ChatController,
  GenerationController,
};

// The generated client imports this to type each RPC module.
export type Controllers = typeof controllers;

export const { GET, POST, PATCH, PUT, HEAD, OPTIONS, DELETE } = initSegment({
  controllers,
});
