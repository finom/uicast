# Security Policy

## Reporting

Use GitHub's private vulnerability reporting on this repository
(**Security → Report a vulnerability**). Do not open a public issue.
Include the package, the mode (`interpret` / `native`), and a minimal
reproducing expression or document.

## Scope

In scope: `interpret` evaluator escapes, membrane or budget bypasses,
prototype pollution, `urlPolicy` bypasses, escapes from the shipped catalog.

Out of scope: `native` mode reaching real prototypes through
run-time-assembled names (its documented residual), and anything a host's own
functions permit — authorization is the host's.

The threat model is documented on the docs site's Security model page.

## Terms

Fixes ship in the latest version of each package — no backports. The software
is provided **as is**, without warranty of any kind, per the
[MIT license](./LICENSE).
