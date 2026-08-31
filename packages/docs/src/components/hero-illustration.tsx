import Image from "next/image";

const ALT =
  "A pipeline: your components and functions merge into one prompt, a model streams entries as JSON lines, and the entries render into a complete app built from those same components.";

/**
 * Front-page pipeline illustration, authored in Claude Design. Served as two
 * pre-themed SVGs from /public (an <img>-loaded SVG can't inherit the page's
 * colors, so the theme swap happens by class): light shows below `.dark`,
 * dark above it. Colors inside the files mirror --muted-foreground and the
 * hero accent per theme.
 */
export function HeroIllustration() {
  return (
    <>
      <Image
        src="/uicast-hero-light.svg"
        alt={ALT}
        width={936}
        height={420}
        priority
        className="h-auto w-full dark:hidden"
      />
      <Image
        src="/uicast-hero-dark.svg"
        alt={ALT}
        width={936}
        height={420}
        priority
        className="hidden h-auto w-full dark:block"
      />
    </>
  );
}
