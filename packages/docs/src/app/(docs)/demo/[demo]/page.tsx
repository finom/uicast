import type { Metadata } from "next";
import { demoManifest } from "@/demo/manifest";
import { DemoRoute } from "./demo-route";

// `dynamicParams = false` turns an unknown slug into a 404.
export function generateStaticParams() {
  return Object.keys(demoManifest).map((demo) => ({ demo }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ demo: string }>;
}): Promise<Metadata> {
  const { demo } = await params;
  // Only the manifest's strings cross into metadata; the registry would drag renderer and Dexie code onto the server path.
  const { title, tagline } = demoManifest[demo];
  return { title, description: tagline };
}

export default async function Page({
  params,
}: {
  params: Promise<{ demo: string }>;
}) {
  const { demo } = await params;
  return <DemoRoute slug={demo} />;
}
