"use client";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { TrackPadImpl } from "./impl";
import trackerEntries from "./entries.json";

const implementations = [TrackPadImpl];

export function Tracker() {
  return (
    <RendererProvider implementations={implementations}>
      <EntriesRenderer entries={trackerEntries} />
    </RendererProvider>
  );
}
