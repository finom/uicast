import Image from "next/image";

const ALT =
  "A pipeline: your components and functions merge into one prompt, a model streams entries, and the entries render into a complete app built from those same components.";

// An <img>-loaded SVG cannot inherit page colors, so the theme swap is by class.
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
