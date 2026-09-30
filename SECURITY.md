# Security Policy

## Reporting

Use GitHub's private vulnerability reporting on this repository: [Report a vulnerability](https://github.com/finom/uicast/security/advisories/new). Do not open a public issue. Include the package (for example `@uicast/expr`) and a minimal reproducing expression or document.

## Scope

In scope: `@uicast/expr` evaluator escapes, membrane or budget bypasses, prototype pollution, `urlPolicy` bypasses, escapes from the shipped catalog.

Out of scope: what an `Evaluator` subclass that sets `toFunction` can reach (it runs expressions as JavaScript, by design), and anything a host's own functions permit — authorization is the host's.

The threat model is on the docs site: [Security model](https://uicast.dev/security).

## Terms

Fixes ship in the latest version of each package — no backports. The software is provided **as is**, without warranty of any kind, per the [MIT license](./LICENSE).
