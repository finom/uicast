import Image from "next/image";

// Logos are grey; `invert` keeps a dark logo visible on the dark theme.
export function Sponsors() {
  return (
    <div className="mb-12 flex flex-col items-center gap-4">
      <p className="text-lg font-medium text-muted-foreground">Sponsors</p>
      <a
        href="https://www.starlingmx.com/"
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border bg-card px-6 py-4 transition-colors hover:bg-accent"
      >
        <Image
          src="/sponsors/starling-mx.png"
          alt="Starling MX"
          width={640}
          height={70}
          className="h-7 w-auto opacity-60 grayscale dark:invert"
        />
      </a>
    </div>
  );
}
