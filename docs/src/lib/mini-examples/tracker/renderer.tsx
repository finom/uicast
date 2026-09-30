"use client";
import { Evaluator } from "@uicast/expr";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { TrackPadImpl } from "./impl";
import trackerEntries from "./entries.json";

const implementations = [TrackPadImpl];
const evaluator = new Evaluator();

export function Tracker() {
  return (
    <RendererProvider implementations={implementations} evaluator={evaluator}>
      <EntriesRenderer entries={trackerEntries} />
    </RendererProvider>
  );
}
