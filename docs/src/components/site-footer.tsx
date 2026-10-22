import Image from "next/image";

const LINKS = [
  ["Getting started", "/getting-started"],
  ["Agent skill", "/getting-started#with-an-agent"],
  ["Security", "/security"],
  ["Live demo", "https://warehouse.uicast.dev"],
  ["GitHub", "https://github.com/finom/uicast"],
  ["npm", "https://www.npmjs.com/package/@uicast/core"],
  ["Discord", "https://discord.com/invite/qdT8WEHUuP"],
  ["X", "https://x.com/andrey_gubanov1"],
  ["standard-tool", "https://standard-tool.js.org/"],
] as const;

// The landing's footer, in the docs' tokens.
export function SiteFooter() {
  return (
    <div className="flex w-full flex-wrap justify-between gap-x-10 gap-y-5 text-[0.9rem] text-muted-foreground">
      <div className="flex flex-col gap-2">
        <a href="/" aria-label="uicast home" className="w-fit">
          <Image src="/logo-text.svg" alt="" width={98} height={23} className="dark:hidden" />
          <Image src="/logo-text-dark.svg" alt="" width={98} height={23} className="hidden dark:block" />
        </a>
        <p>The expression-driven generative UI framework. MIT License, in beta.</p>
        <p>
          © {new Date().getFullYear()}{" "}
          <a href="https://github.com/finom" className="text-(--uc-accent-text) hover:underline">
            Andrey Gubanov
          </a>
        </p>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-6 gap-y-2">
        {LINKS.map(([label, href]) => (
          <a key={href} href={href} className="py-1.5 text-(--uc-accent-text) hover:underline">
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
