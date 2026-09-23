import entries from "@/lib/mini-examples/orders/entries.json";

// The Concepts page shows entries arriving as data. The site is a static export, so this is prerendered to a file.
export const dynamic = "force-static";

export function GET() {
  return Response.json(entries);
}
