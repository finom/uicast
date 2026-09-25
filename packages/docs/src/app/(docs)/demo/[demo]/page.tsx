import type { Metadata } from "next";
import { demoManifest } from "@/demo/manifest";
import { DemoRoute } from "./demo-route";

// `dynamicParams = false` turns an unknown slug into a 404.
export function generateStaticParams() {
  return Object.keys(demoManifest).map((demo) => ({ demo }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ demo: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { demo } = await params;
  // Only the manifest's strings cross into metadata; the registry would drag the impls and Dexie onto the server path.
  const { title, tagline } = demoManifest[demo];
  return { title, description: tagline };
}

export default async function Page({ params }: Props) {
  const { demo } = await params;
  return <DemoRoute slug={demo} />;
}
