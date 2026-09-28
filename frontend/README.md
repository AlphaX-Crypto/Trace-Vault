# TRACEVAULT investigator frontend

This frontend provides a secure sign-in, an authenticated case registry, and a focused investigation workspace. Each workspace section has one job: case overview, transactions, graph, timeline, risk, attribution, geospatial, evidence, and report review.

## Design foundation

- Canvas `#071018`, surfaces `#0b161f` and `#101c26`, with restrained teal `#24c7c9` for active controls.
- Inter for interface text and DM Mono with system monospace fallbacks for identifiers and ledger references.
- Dark institutional surfaces, clear labels, and no decorative analytics. Cross-rail colors follow `docs/INVESTIGATOR_WORKSPACE.md`.
- Risk values are investigative indicators; associations do not establish identity or ownership. Missing source timestamps display as `TIME UNKNOWN`.

## Data and access

`src/services/api.js` remains the centralized client for Express. The frontend uses the existing authenticated routes for sign-in, session verification, case list/detail, analysis, evidence, and investigation APIs. It does not synthesize case, analysis, or identity data when those calls fail. `AuthContext` and `ProtectedRoute` preserve the existing session boundary. Express, the intelligence engine, PostgreSQL, RBAC, and API contracts are outside this frontend.

## Local development

Configure `VITE_API_BASE_URL` in `.env` when the API is not available through the Vite `/api` and `/health` proxy. Then run:

```sh
npm run dev
npm run build
```

`node test_ui.mjs` runs browser smoke checks and captures screenshots in the task output directory. Set `TRACEVAULT_TEST_USERNAME` and `TRACEVAULT_TEST_PASSWORD` to exercise the authenticated case flow; the script contains no credentials.
