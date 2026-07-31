"use client";
import { Renderer } from "@uicast/react";
import { CounterImpl } from "./impl";
import counterEntries from "./entries.json";

const implementations = [CounterImpl];

export function Counter() {
  return <Renderer implementations={implementations} entries={counterEntries} />;
}
