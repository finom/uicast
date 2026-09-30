export const SITE = "https://uicast.dev";

// A docs page's social card, rendered by `app/og/[...slug]/route.tsx`.
export const ogImage = (route: string) => `/og/${route === "/" ? "index" : route.slice(1)}.png`;
