"use client";
import { notFound } from "next/navigation";
import { getDemo } from "@/demo/registry";
import { DemoPlayer } from "../demo-player";

// The config holds closures, so it cannot cross the server→client boundary. Keyed by slug, so a switch remounts the player.
export function DemoRoute({ slug }: { slug: string }) {
  const demo = getDemo(slug);
  if (!demo) notFound();
  return <DemoPlayer key={demo.slug} demo={demo} />;
}
