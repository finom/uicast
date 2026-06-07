import type { Metadata } from "next";
import { demoManifest, demoSlugs } from "@/demo/manifest";
import { DemoRoute } from "./DemoRoute";

// Pre-render one route per known demo. `dynamicParams = false` turns any other
// slug into a 404 at the routing layer (so `/nope` never reaches the client).
export function generateStaticParams() {
  return demoSlugs.map((demo) => ({ demo }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ demo: string }>;
}): Promise<Metadata> {
  const { demo } = await params;
  const meta = demoManifest.find((d) => d.slug === demo);
  // Only server-safe strings (from the manifest) cross into metadata — never the
  // runtime registry, which would drag renderer/Dexie code onto the server path.
  return meta
    ? { title: meta.title, description: meta.tagline }
    : { title: "Not found" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ demo: string }>;
}) {
  const { demo } = await params;
  return <DemoRoute slug={demo} />;
}
