import { impls } from "@uicast/shadcn-catalog/all/impls";
import { demoManifest } from "../manifest";
import type { DemoConfig } from "../types";
import { boardLines } from "./board.lines";
import { NodeBoardImpl } from "./components/node-board/impl";
import { boardFunctions } from "./functions";

export const boardDemo: DemoConfig = {
  slug: "board",
  ...demoManifest.board,
  lines: boardLines,
  functions: boardFunctions,
  catalog: [...impls, NodeBoardImpl],
};
