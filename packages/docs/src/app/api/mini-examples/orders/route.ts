import entries from "@/lib/mini-examples/orders/entries.json";

// The orders mini-example fetches its document instead of importing it, so the
// snippet on the Concepts page shows entries arriving as data. The docs site is
// a static export, so this handler must be prerendered to a file.
export const dynamic = "force-static";

export function GET() {
  return Response.json(entries);
}
