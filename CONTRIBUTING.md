# Contributing

## Setup

Node 24 or newer.

```sh
npm ci
```

## Before a pull request

The same gate CI runs:

```sh
npm run typecheck && npm run lint && npm test
```

A change in behavior comes with a test. Lint warnings fail the gate.

## Changing the expression language

Anything that adds or removes syntax, a method, a global or a cap in `@uicast/expr` is a language change. Open an issue first; the prompt and the docs mirror the language and change with it.

## Security

Do not open an issue for a vulnerability. See [SECURITY.md](./SECURITY.md).
