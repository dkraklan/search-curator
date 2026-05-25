# curator — Commands

## Prerequisites

- Node.js 20+
- `core` running at `localhost:8000` (the curator frontend proxies all API calls to it)
- Infrastructure running: `docker compose up -d postgres opensearch` (from repo root)
- `core` migrations and grants must have been applied first — see `core/docs/COMMANDS.md`

## Setup (run once)

```bash
cd curator
npm install
```

## Run

```bash
# From curator/
npm run dev
```

Opens the reviewer UI at `http://localhost:5173`. Vite proxies `/internal/*` to `core` at `localhost:8000` automatically — no env file needed.

Start `core` first in a separate terminal:

```bash
cd core
uv run uvicorn main:app --reload --port 8000
```

## Build (production)

```bash
cd curator
npm run build               # outputs to curator/dist/
```

Ansible copies `dist/` to the core EC2 host during deployment. Core's FastAPI process serves it as static files at `/curator/`. See `ansible/docs/architecture.md` for the deploy step.

## Dependencies

```bash
npm install <package>
npm install --save-dev <package>
```

## Lint

```bash
npm run lint
```

## Tests

There are no automated tests in Phase 0. Add component tests with Vitest in Phase 1.
