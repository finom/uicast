# @uicast/back-office

Part of [**uicast**](https://github.com/finom/uicast), the expression-driven generative UI framework.

A back office for **Warehouse**, a made-up store: suppliers, products, customers, orders and a stock ledger in Postgres. The shell (sidebar, chat panel) is hand-written. Every page and chat answer is a **uicast** document a model writes against `@uicast/shadcn-catalog`, rendered live. A page is stored as rows of entries, so nothing is built or deployed per generation.

Everything is world-readable; only the owner can write. Logging in with OpenRouter (OAuth PKCE) creates an account with a random slug and a private copy of the demo data. Generations run on the OpenRouter key the login grants, so they bill your own credits. OpenRouter returns a key but no user id, so the account lives in a session cookie: after you log out, the next login creates a new account. Logged out, you can read the seed account, `@uicast`.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffinom%2Fuicast%2Ftree%2Fmain%2Fexamples%2Fback-office&project-name=uicast-back-office&repository-name=uicast-back-office&env=APP_SECRET&envDescription=Encrypts%20the%20stored%20OpenRouter%20keys.%20Make%20one%20with%3A%20openssl%20rand%20-base64%2032&stores=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%5D)

Vercel creates a Neon database and asks for `APP_SECRET` (make one with `openssl rand -base64 32`). The first deploy creates the tables and the demo account.

Each production deploy runs `db:push -- --force` before the build, so a schema change that drops data applies without asking.

## Run

Inside this repo, it runs against the packages' source. To start your own app, use [`examples/starter`](../starter).

```bash
npm install                                                      # repo root
docker compose -f examples/back-office/docker-compose.yml up -d  # local Postgres
cp examples/back-office/.env.example examples/back-office/.env.local
npm run db:push -w @uicast/back-office
npm run dev -w @uicast/back-office
```

Optional: `npm run db:seed -w @uicast/back-office` writes the `@uicast` demo account, whose pages and chats logged-out visitors browse. Without it, logging in still gives you a copy of the demo data.

Set these in `examples/back-office/.env.local`:

- `DATABASE_URL`: the Postgres connection string. The example points at the docker-compose database; in production it is a Neon pooled connection string.
- `APP_SECRET`: encrypts the stored OpenRouter keys. Login fails without it. Generate one with `openssl rand -base64 32`.
- `OPENROUTER_MODEL`: optional, the model every generation uses. Default `anthropic/claude-opus-5.5`.

There is no site-wide model key: each user's OpenRouter key is stored encrypted on their account.

Each page and chat answer shows its token counts and an estimated cost. Prices come from `src/lib/pricing.ts`, one row per model; a model without a row shows no cost. Requests use OpenRouter's prompt caching: a prompt prefix repeated within five minutes bills at the cache-read price.

`db:push` and `db:seed` do not load `.env.local`. They take `DATABASE_URL` from the environment, else the docker-compose default. To target another database, set it inline: `DATABASE_URL=<url> npm run db:push -w @uicast/back-office`.

## Routes

- `/`: the latest pages and chats from every account.
- `/pages/new`, `/chats/new`: create a page or start a chat. Login required.
- `/u/[slug]`: one account's pages and chats.
- `/u/[slug]/p/[id]`: a page. Its owner can generate and edit it; everyone else reads it.
- `/u/[slug]/c/[id]`: a chat, with the same rule.
- `/api/*`: the REST API the tools call (`suppliers`, `products`, `customers`, `orders`, `stock-movements`, `orders/summary`, `products/summary`), plus `generate`, `chat`, `pages`, `chats` and `auth/*`.

## Things to try

In the generated UIs, forms validate and submit, buttons change the database through the domain tools, destructive actions ask for confirmation, and every widget bound to the same state updates together.

**Create page** streams a full page onto `/u/<slug>/p/<id>`:

- `Order dashboard with quick status actions`
- `Order intake terminal for phone orders`
- `Product catalog with an add-product form`
- `Customer manager with edit and delete`

**New chat** answers with live UI, in `uicast` fences rendered by `@uicast/streamdown`:

- `Mark pending orders as paid`
- `Receive a delivery for a product`
- `Set up a new supplier and product`
- `Orders kanban: drag to change status`
- `Top customers, with a New order button`

The Source toggle above a chat block shows the JSON Lines the model wrote.

[uicast.dev/example-app](https://uicast.dev/example-app) shows where each **uicast** piece sits in the app.

## License

[MIT](https://github.com/finom/uicast/blob/main/LICENSE) © [Andrey Gubanov](https://github.com/finom)
