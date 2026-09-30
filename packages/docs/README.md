<h1 align="center">@uicast/docs</h1>
<p align="center">Part of <a href="https://github.com/finom/uicast"><strong>uicast</strong></a>, the expression-driven generative UI framework.</p>
<p align="center"><a href="https://uicast.dev">uicast.dev</a></p>

The **uicast** documentation site, [uicast.dev](https://uicast.dev). Built with [Nextra](https://nextra.site/) and exported as static files.

## Run

From the repo root:

```sh
npm install
npm run dev -w @uicast/docs     # http://localhost:3000
npm run build -w @uicast/docs   # static export to out/, with a Pagefind search index
```

The site imports the other packages from their source, so a change in `packages/*/src` shows up without a build. The back office also uses port 3000; `npm run dev -w @uicast/docs -- -p 3001` runs both.

## Layout

- Pages are MDX under `src/app/(docs)/`. The sidebar order is in `src/app/_meta.global.tsx`.
- A code fence with `localpath="<path from the repo root>"` gets that file's content on `predev` and `prebuild`, so samples stay in sync with the code.
- `src/components/replay/` holds the demo at the top of the index page. Each of its prompts plays a prewritten document entry by entry, the way a model response streams, over data kept in memory. It runs in the browser, with no backend.
- `src/lib/mini-examples/` holds the small live examples inside the pages.

## License

[MIT](https://github.com/finom/uicast/blob/main/LICENSE) © [Andrey Gubanov](https://github.com/finom)
