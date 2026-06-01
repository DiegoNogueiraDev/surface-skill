# Support tickets — weekly digest (chunk-friendly)

Source: 50 customer support tickets, 2026-05-25 → 2026-05-31. Summarized for RAG ingest.
Markdown chosen: clean chunking, token-efficient at re-embed scale, no styling needed.

## Billing

Customers reported duplicate charges after the May plan migration. Root cause was a
retry on the payment webhook. Fixed in `billing-svc@1.8.2`. 7 tickets, all resolved,
refunds issued automatically.

## Authentication

SSO logins via Okta failed intermittently for ~40 minutes on 2026-05-27 due to an
expired SAML certificate. Rotated and alerting added. 12 tickets, resolved.

## Performance

Dashboard load times above 5s for workspaces with >10k records. Mitigated with
server-side pagination; full fix tracked in PERF-441. 9 tickets, mitigated.

## Feature requests

Most-requested: CSV export of filtered views (14 mentions), dark mode (6),
webhook retries config (4). Logged to the product backlog.

## Resolution summary

- Resolved: 41
- Mitigated / pending fix: 9
- Median first response: 38 min
