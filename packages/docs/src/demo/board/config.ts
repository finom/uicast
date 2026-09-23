import { impls } from "@uicast/shadcn-catalog/all-impls";
import { demoManifest } from "../manifest";
import type { DemoConfig } from "../types";
import { boardLines } from "./board.lines";
import { NodeBoardRenderer } from "./components/node-board/renderer";
import { boardFunctions } from "./functions";

export const boardDemo: DemoConfig = {
  slug: "board",
  ...demoManifest.board,
  lines: boardLines,
  functions: boardFunctions,
  catalog: [...impls, NodeBoardRenderer],
};
