# Chores

<!-- Append via gflow_capture tool, /skill:gflow-capture, or /gf-capture. Remove via gflow_dismiss_inbox_item or drain via gflow-triage-inbox. Do not hand-edit. -->
- [x] 2026-05-25 Scaffold curator React project: package.json, tsconfig.json, vite.config.ts, index.html, and directory structure (src/views/, src/components/, src/api/)  <!-- done -->
- [x] 2026-05-25 Install curator dependencies: React, TypeScript, Vite, Recharts, TanStack Query, and dev tooling (eslint, @types/react, etc.)  <!-- done -->
- [x] 2026-05-25 Configure vite.config.ts with dev proxy: /internal/* → http://localhost:8000  <!-- done -->
- [x] 2026-05-25 Create typed API client src/api/queue.ts with GET /internal/queue and GET /internal/queue/:page_id wrappers  <!-- done -->
- [x] 2026-05-25 Create typed API client src/api/labels.ts with POST /internal/labels and GET /internal/labels/:page_id wrappers  <!-- done -->
- [x] 2026-05-25 Create typed API client src/api/domains.ts with GET /internal/domains, GET /internal/domains/:domain_id, and PUT /internal/domains/:domain_id wrappers  <!-- done -->
- [x] 2026-05-25 Create typed API client src/api/calibration.ts with GET/POST /internal/calibration/* wrappers (component-override-rates, outliers, weight-history)  <!-- done -->
- [x] 2026-05-25 Implement auth layer: store Basic Auth credentials in memory, attach Authorization header to all API fetches  <!-- done -->
- [x] 2026-05-25 Build ReviewQueue view (/queue): left iframe panel, right HVS score card with label/confidence/notes/submit, top filters, progress counter, keyboard shortcuts (1-5, Enter)  <!-- done -->
- [x] 2026-05-25 Build DomainReview view (/domains): sortable domain table, domain detail with HVS histogram, worst/best pages, status/seed_tier action buttons  <!-- done -->
- [x] 2026-05-25 Build CalibrationDashboard view (/calibration): component override rates bar chart (Recharts), outlier table, weight history log  <!-- done -->
- [x] 2026-05-25 Set up client-side routing between /queue, /domains, and /calibration views  <!-- done -->
- [x] 2026-05-25 Create shared UI components in src/components/ (buttons, tables, forms, layout shell with nav)  <!-- done -->
- [x] 2026-05-25 Add npm scripts to package.json: dev, build, lint (placeholder for test in Phase 1)  <!-- done -->
- 2026-05-25 Add Vitest + @testing-library/react for curator unit tests
- 2026-05-25 Inline styles in all components — extract to CSS modules or Tailwind
- 2026-05-25 labelsToday counter resets on navigation/refresh — persist to sessionStorage or fetch from server
- 2026-05-25 apiFetch contentLength check is unreliable for chunked responses
- 2026-05-25 iframe sandbox allow-same-origin on external URLs — security concern
- 2026-05-25 useQuery retry:1 globally without 401 exclusion
