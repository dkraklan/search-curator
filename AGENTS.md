# curator — AGENTS.md

Internal reviewer UI. Pure React application. No Python backend — all API routes live in `core/api/internal/`. Read this fully before writing any code.

## Read First

- `docs/overview.md` — what this project owns, folder structure, label schema
- `docs/architecture.md` — data flows, API contract with core, frontend views
- `docs/COMMANDS.md` — setup and run commands

## What This Project Is

A React single-page application used by human reviewers to inspect crawled pages, submit quality labels, and view calibration data. It talks exclusively to `core`'s internal API routes. There is no Python in this project.

## What This Project Does NOT Own

- Any API routes or business logic — those are in `core/api/internal/`
- The HVS scorer — that is `core/hvs/`
- Database access of any kind — core owns all DB connections
- Infrastructure provisioning — that is `ansible/`
- Anything user-facing or public

## Folder Structure (brief)

```
curator/
├── src/
│   ├── views/          Review queue, domain review, calibration dashboard
│   ├── components/     Shared UI components
│   └── api/            Typed fetch wrappers for core's /internal/* routes
├── public/
├── package.json
└── vite.config.ts
```

## Non-Negotiable Conventions

**No business logic in the frontend.** Filtering, scoring, label validation — all of that lives in core. The UI submits and displays; it does not compute.

**All API calls go to `/internal/*`.** Do not call any public-facing core routes. Do not introduce a proxy or a secondary backend.

**Labels are append-only.** The UI should not offer an edit or delete flow. Resubmit = new row; core handles duplicates by taking the most recent per reviewer.

**Never expose to public internet.** The production deployment is VPN-only. Do not add any feature that assumes public access.
