import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";
import { ogImage, SITE } from "@/lib/site";
import { jsonLd } from "@/lib/structured-data";

const TITLE = "uicast — The expression-driven generative UI framework";
const DESCRIPTION =
  "An open-source framework for UIs written by models: the model streams JSONLines entries, the engine renders them with your components.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE}/` },
  openGraph: { url: `${SITE}/`, images: [{ url: SITE + ogImage("/"), width: 1280, height: 640 }] },
  twitter: { images: [SITE + ogImage("/")] },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: our own JSON, escaped by `jsonLd`
        dangerouslySetInnerHTML={{ __html: jsonLd("/", "uicast", DESCRIPTION) }}
      />
      <Landing />
    </>
  );
}
