"use client";
import { allImplementations } from "@ui-fired/catalog/impls";
import type { DemoConfig } from "../types";
import { boardLines } from "./board.lines";
import { boardPrompt } from "./board.prompt";
import { NodeBoardRenderer } from "./components/node-board/renderer";
import { boardFunctions } from "./functions";

/**
 * The board demo: a single bespoke NodeBoard component that emits two
 * differently-shaped events — spatial { id, x, y } on drag, relational
 * { from, to } on connect — both flowing into one reactive `scopes.root`.
 */
export const boardDemo: DemoConfig = {
  slug: "board",
  title: "Flow board",
  tagline:
    "A node canvas from one bespoke component — dragging emits a spatial { id, x, y }, wiring two nodes emits a relational { from, to }.",
  prompt: boardPrompt,
  lines: boardLines,
  functions: boardFunctions,
  catalog: [...allImplementations, NodeBoardRenderer],
};
