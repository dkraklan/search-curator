# curator — Architecture

## What Curator Is (and Isn't)

`curator` is a React SPA. It has no backend of its own. All API routes, database access, and business logic live in `core/api/internal/`. Curator's only job is to render data and submit reviewer actions.

```
curator (React SPA)
  │
  └── /internal/*  →  core (port 8000)
                         ├── READ  PostgreSQL: pages, domains, hvs_labels
                         ├── READ  OpenSearch: pages index
                         ├── WRITE PostgreSQL: hvs_labels (INSERT)
                         └── WRITE PostgreSQL: domains (status, seed_tier only)
```

In production, `core` serves the compiled curator frontend as static files at `/curator/`. Same origin — no CORS.

## API Contract

All routes are prefixed `/internal/` in core. They are not reachable from the public internet — restricted at the load balancer / security group level. HTTP Basic Auth is enforced on all `/internal/*` routes in core.

### Review Queue

```
GET /internal/queue?min_hvs=30&max_hvs=60&limit=20&unlabeled_only=true
  → Returns pages from OpenSearch (borderline HVS range), enriched with
    raw signal values from PostgreSQL (author, word_count, entity_count, etc.)
  → Reviewer sees both the score breakdown and the inputs that produced it

GET /internal/queue/:page_id
  → Single page detail: full hvs_components, all extractor outputs, existing labels
```

### Label Submission

```
POST /internal/labels
  body: { page_id, label, confidence, notes }
  → Validates page_id exists
  → Inserts into hvs_labels; labeled_by set server-side from Basic Auth username
  → UNIQUE(page_id, labeled_by) enforced in DB — resubmit replaces via upsert

GET /internal/labels/:page_id
  → All existing labels for a page (for showing prior reviewer decisions)
```

### Domain Review

```
GET /internal/domains?status=active&order_by=hvs_avg_asc&limit=50
  → Paginated domain list from PostgreSQL

GET /internal/domains/:domain_id
  → Domain detail + 10 lowest/highest scoring pages

PUT /internal/domains/:domain_id
  body: { status?: string, seed_tier?: number }
  → Updates domains.status and/or domains.seed_tier (scoped columns only)
  → seed_tier promotion to 1 requires the UI to send a confirmation flag
```

### Calibration Dashboard

```
GET /internal/calibration/component-override-rates
  → Per-signal override rates computed from hvs_labels vs. hvs_components

GET /internal/calibration/outliers?limit=20
  → Pages where human label diverges most from rule-predicted score

GET /internal/calibration/weight-history
  → Append-only log of past HVS weight updates (version, changes, applied_by)

POST /internal/calibration/weight-history
  → Engineer records a weight update after editing hvs_weights_vN.json
```

## Frontend Views

### Review Queue (`/queue`)

Primary working view for reviewers.

- Left panel: iframe of the page being reviewed
- Right panel: HVS score card (all component values + raw inputs), label selector, confidence selector, notes field, submit button
- Top bar: HVS range filter, domain filter, unlabeled-only toggle
- Progress counter: labels today / labels this session

Keyboard shortcuts: `1`=high_quality, `2`=spam, `3`=affiliate_farm, `4`=ai_farm, `5`=borderline, `Enter`=submit and advance.

### Domain Review (`/domains`)

Table view of all domains. Columns: domain, seed_tier, hvs_avg, page_count, publish_velocity, status, last_crawled_at. Sortable. Clickable row opens domain detail with HVS histogram, worst/best pages, and action buttons.

### Calibration Dashboard (`/calibration`)

Three sections:

1. **Component override rates** — bar chart per signal. Red if override rate > 30%. Clicking shows outlier pages for that component.
2. **Outlier table** — pages where human label diverges most from rule score. Side-by-side: rule score, reviewer label, component breakdown.
3. **Weight history** — past updates: version, date, changed components, applied by.

## Dev Proxy

In development, Vite proxies `/internal/*` to `core` so the frontend can run against the real API with no CORS setup:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/internal': 'http://localhost:8000',
    },
  },
})
```

## Production Deployment

`core`'s FastAPI process mounts the compiled curator frontend:

```python
# core/main.py (added when curator dist/ is present)
app.mount("/curator", StaticFiles(directory="curator/dist", html=True), name="curator")
```

All `/internal/*` API routes are registered before the static mount and take precedence. Ansible copies the built `curator/dist/` to the core EC2 host as part of the curator deploy step.

## Auth (Phase 0)

HTTP Basic Auth with a shared credential (`CURATOR_USERNAME` / `CURATOR_PASSWORD` env vars in core). The React app stores the credential in memory and sends it with every fetch. `labeled_by` is set server-side from the Basic Auth username.

Phase 1: replace with per-reviewer accounts and session tokens. The `labeled_by` field must uniquely identify individuals to support inter-reviewer agreement statistics.
