"use client";
import { notFound } from "next/navigation";
import { getDemo } from "@/demo/registry";
import { DemoPlayer } from "../DemoPlayer";

/**
 * Client-side bridge: the server route hands us a serializable `slug`, and we
 * resolve the rich {@link DemoConfig} (renderer fns, host functions, the
 * artifact) here in client land — those values can't cross the server→client
 * prop boundary. Keyed by slug so switching demos fully remounts the player,
 * resetting `count`/`phase`/the reveal timer with no stale closures.
 */
export function DemoRoute({ slug }: { slug: string }) {
  const demo = getDemo(slug);
  if (!demo) notFound();
  return <DemoPlayer key={demo.slug} demo={demo} />;
}
