# @uicast/docs

Part of [**uicast**](https://github.com/finom/uicast), the expression-driven generative UI framework.

The **uicast** documentation site, [uicast.dev](https://uicast.dev). Built with [Nextra](https://nextra.site/) and exported as static files.

## Run

From the repo root:

```sh
npm install
npm run dev -w @uicast/docs     # http://localhost:3000
npm run build -w @uicast/docs   # static export to out/, with a Pagefind search index
```

The site imports the other packages from their source, so a change in `packages/*/src` shows up without a build. The demo app also uses port 3000; `npm run dev -w @uicast/docs -- -p 3001` runs both.

## Layout

- Pages are MDX under `src/app/(docs)/`. The sidebar order is in `src/app/_meta.global.tsx`.
- A code fence with `localpath="<path from the repo root>"` gets that file's content on `predev` and `prebuild`, so samples stay in sync with the code.
- `src/demo/` holds the demos at `/demo`. Each replays a document entry by entry, the way a model response streams: Inventory, a CRUD dashboard over an in-browser database, and Groovebox, Palette studio and Flow board, built from custom components with their own event payloads. They run in the browser, with no backend.
- `src/lib/mini-examples/` holds the small live examples inside the pages.

## License

[MIT](https://github.com/finom/uicast/blob/main/LICENSE) © [Andrey Gubanov](https://github.com/finom)
