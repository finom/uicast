import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { OgCard } from "@/components/og-card";
import { docsPages } from "@/lib/docs-pages";
import { ogImage, sectionOf } from "@/lib/site";

// One social card per docs page. The static export writes each to a file.
export const dynamic = "force-static";
export const dynamicParams = false;

const asset = (file: string) => readFile(path.join(process.cwd(), "src/app/og", file));

// next/og measures a word glyph by glyph but draws it kerned, which leaves a gap after kerned words. Renaming the
// kerning tables hides them, so both agree.
const unkerned = (font: Buffer) => {
  for (let at = 12; at < 12 + 16 * font.readUInt16BE(4); at += 16) {
    const tag = font.toString("latin1", at, at + 4);
    if (tag === "GPOS" || tag === "kern") font.write(tag.toLowerCase(), at, "latin1");
  }
  return font;
};

export async function generateStaticParams() {
  return ["/", ...(await docsPages()).map(({ route }) => route)].map((route) => ({
    slug: ogImage(route).split("/").slice(2),
  }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const path = `/og/${(await params).slug.join("/")}`;
  const index = path === ogImage("/");
  const page = index ? undefined : (await docsPages()).find(({ route }) => ogImage(route) === path);
  if (!index && !page) return new Response(null, { status: 404 });
  const [lockup, sans, mono] = await Promise.all([
    asset("lockup.svg"),
    asset("instrument-sans-regular.ttf"),
    asset("ibm-plex-mono-medium.ttf"),
  ]);
  return new ImageResponse(
    <OgCard
      lockup={`data:image/svg+xml;base64,${lockup.toString("base64")}`}
      section={page && sectionOf(page.route)}
      text={page ? page.title : "The expression-driven generative UI framework."}
      footer={page ? `uicast.dev${page.route}` : "github.com/finom/uicast"}
    />,
    {
      width: 1280,
      height: 640,
      fonts: [
        { name: "Instrument Sans", data: unkerned(sans), weight: 400 },
        { name: "IBM Plex Mono", data: unkerned(mono), weight: 500 },
      ],
    },
  );
}
