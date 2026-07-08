"use client";
import { Renderer } from "@ui-fired/react";
import { CounterImpl } from "./impl";
import counterEntries from "./entries.json";

const implementations = [CounterImpl];

export function Counter() {
  return <Renderer implementations={implementations} entries={counterEntries} />;
}
