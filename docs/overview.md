# curator — Overview

## What This Is

`curator` is the internal reviewer UI. It is a React single-page application used exclusively by human reviewers to inspect crawled pages, submit quality labels, and calibrate HVS scoring weights. It is not exposed to the public internet.

There is no Python backend in this project. All data access and business logic lives in `core`. Curator talks to `core`'s internal API routes (`/internal/*`), which are restricted to the VPN/internal network and not reachable from the public internet.

This document is written for a coding agent or engineer working inside the `curator/` directory.

## Why This Is a Separate Project

Keeping the reviewer UI in its own project enforces a clean boundary: a coding agent working on `core` does not touch labeling UI code, and a coding agent working on `curator` does not touch scoring logic or database access. `core` owns all data; `curator` owns only the interface for humans to interact with it.

## What This Project Owns

- Review queue interface: displays borderline pages (HVS 30–60) for labeling
- Domain review interface: aggregate domain health view with actions (promote, block, flag)
- Calibration dashboard: per-component override rates, disagreement outliers, weight update history
- Typed API client (`src/api/`) wrapping all `core` internal routes

## What This Project Does NOT Own

- Any API routes or backend logic — those live in `core/api/internal/`
- Database access of any kind
- The HVS scorer — that is `core/hvs/`
- Deployment infrastructure — that is `ansible/`
- User-facing search — that is `core/api/`

## Who Uses This

Human reviewers (2–3 people in Phase 0). Not end users. Access is restricted to the internal network (VPN-only in production).

## Folder Structure

```
curator/
├── docs/                   — This folder.
│
├── src/
│   ├── views/
│   │   ├── ReviewQueue.tsx        — borderline page labeling view
│   │   ├── DomainReview.tsx       — per-domain aggregate view
│   │   └── CalibrationDashboard.tsx — override rate charts and outliers
│   ├── components/                — shared UI components
│   └── api/                       — typed fetch wrappers for /internal/* routes
│         labels.ts
│         queue.ts
│         domains.ts
│         calibration.ts
│
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts                 — dev server proxies /internal/* to core at localhost:8000
```

## Key Dependencies

| Library | Purpose |
|---|---|
| React | UI framework |
| TypeScript | Type safety |
| Recharts | Calibration dashboard charts |
| TanStack Query | Data fetching and cache |
| Vite | Dev server and build tool |

## Configuration

In development, Vite proxies all `/internal/*` requests to `core` running at `localhost:8000`. No `.env` file is needed for the frontend — the proxy is configured in `vite.config.ts`.

In production, `curator` is built to static files and served by `core`'s FastAPI process, which mounts the `dist/` directory at `/curator/`. The internal API routes and the UI are co-deployed on the same origin, so no CORS configuration is required.

## Label Schema

Labels submitted by reviewers:

| Label | Meaning |
|---|---|
| `high_quality` | Genuine human-authored content; HVS score reflects its quality correctly |
| `spam` | Low-quality, keyword-stuffed, or thin content |
| `affiliate_farm` | Content primarily structured around affiliate links |
| `ai_farm` | AI-generated or AI-assisted content at scale |
| `borderline` | Genuinely ambiguous; reviewer cannot confidently assign another label |
| `needs_context` | Requires domain-level knowledge to assess; escalate |

Confidence levels: `high`, `medium`, `low`. Low confidence labels are weighted less in calibration.
