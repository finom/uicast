import meta from "@/app/_meta.global";

export const SITE = "https://uicast.dev";

// A docs page's social card, rendered by `app/og/[...slug]/route.tsx`.
export const ogImage = (route: string) => `/og/${route === "/" ? "index" : route.slice(1)}.png`;

// The sidebar section a page sits in, if any.
export const sectionOf = (route: string) => {
  const folder = meta[route.split("/")[1]];
  return typeof folder === "object" && "items" in folder ? String(folder.title) : undefined;
};
