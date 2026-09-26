# uicast Next.js starter

The [getting started](https://uicast.dev/getting-started) app: type a prompt and get a UI built from the [reference catalog](https://uicast.dev/react/reference-catalog), with data from one host function.

```sh
npx create-next-app@latest my-app --example https://github.com/finom/uicast/tree/main/examples/starter
cd my-app
echo "AI_GATEWAY_API_KEY=your-key" > .env.local
npm run dev
```

Or deploy a copy to Vercel. There, the AI Gateway needs no key.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffinom%2Fuicast%2Ftree%2Fmain%2Fexamples%2Fstarter&project-name=uicast-app&repository-name=uicast-app)

- `src/app/api/generate/route.ts` builds the prompt and streams the model's answer. The model is `anthropic/claude-opus-5.5`, through the [Vercel AI Gateway](https://vercel.com/ai-gateway).
- `src/tools/` holds the host functions the model may call.
- `src/app/api/orders/route.ts` stands in for your API.
