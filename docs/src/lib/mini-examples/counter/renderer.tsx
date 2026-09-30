"use client";
import { Evaluator } from "@uicast/expr";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { CounterImpl } from "./impl";
import counterEntries from "./entries.json";

const implementations = [CounterImpl];
const evaluator = new Evaluator();

export function Counter() {
  return (
    <RendererProvider implementations={implementations} evaluator={evaluator}>
      <EntriesRenderer entries={counterEntries} />
    </RendererProvider>
  );
}
