# Payments service — PRD (hybrid: MD for the next agent, HTML islands for density)

> Format: **hybrid-md-html**. The architect agent reads Markdown reliably; the embedded
> HTML blocks carry the decision table and data-flow without losing structure. Each HTML
> block is valid in isolation (renders on GitHub/Obsidian).

## Goal

Ship a payments service that charges cards, handles webhooks idempotently, and exposes a
ledger other services can read. Target: first charge in staging within two weeks.

## Decision table

<table>
  <thead>
    <tr><th>Concern</th><th>Choice</th><th>Why</th></tr>
  </thead>
  <tbody>
    <tr><td>Processor</td><td>Stripe</td><td>Existing contract, idempotency keys built in.</td></tr>
    <tr><td>Idempotency</td><td>Key per request, 24h dedup window</td><td>Webhook retries must not double-charge.</td></tr>
    <tr><td>Ledger</td><td>Append-only Postgres table</td><td>Auditable; other services read, never mutate.</td></tr>
  </tbody>
</table>

## Data flow

<figure>
  <svg viewBox="0 0 520 120" xmlns="http://www.w3.org/2000/svg" role="img">
    <title>Payment request data flow</title>
    <desc>Client to API to Stripe, webhook back to ledger.</desc>
    <rect x="8" y="40" width="90" height="40" rx="6" fill="#eef" stroke="#557"/>
    <text x="53" y="64" text-anchor="middle" font-size="12">Client</text>
    <rect x="148" y="40" width="90" height="40" rx="6" fill="#eef" stroke="#557"/>
    <text x="193" y="64" text-anchor="middle" font-size="12">API</text>
    <rect x="288" y="40" width="90" height="40" rx="6" fill="#eef" stroke="#557"/>
    <text x="333" y="64" text-anchor="middle" font-size="12">Stripe</text>
    <rect x="420" y="40" width="92" height="40" rx="6" fill="#efe" stroke="#575"/>
    <text x="466" y="64" text-anchor="middle" font-size="12">Ledger</text>
    <line x1="98" y1="60" x2="148" y2="60" stroke="#557" marker-end="url(#a)"/>
    <line x1="238" y1="60" x2="288" y2="60" stroke="#557" marker-end="url(#a)"/>
    <line x1="378" y1="60" x2="420" y2="60" stroke="#575" marker-end="url(#a)"/>
    <defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#557"/></marker></defs>
  </svg>
</figure>

## Acceptance criteria

- A repeated webhook with the same idempotency key produces exactly one ledger entry.
- A failed charge writes a `failed` ledger row with the processor error code.
- The ledger endpoint is read-only and paginated.
