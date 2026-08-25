"use client";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { WeatherCardImpl } from "./impl";
import { getWeather } from "./functions";
import weatherEntries from "./entries.json";

const implementations = [WeatherCardImpl];
const functions = [getWeather];

export function Weather() {
  return (
    <RendererProvider implementations={implementations} functions={functions}>
      <EntriesRenderer entries={weatherEntries} />
    </RendererProvider>
  );
}
