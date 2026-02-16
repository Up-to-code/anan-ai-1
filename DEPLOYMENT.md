# Deployment (Monorepo)

Single repo: convex, web, admin, mobile.

## Convex

- **CI:** `.github/workflows/deploy-convex.yml` deploys on push to `main` when `convex/` changes.
- **Secret:** `CONVEX_DEPLOY_KEY` (from Convex Dashboard → Project Settings).
- To deploy Convex to production from your machine: run `npm run deploy:convex` (or `bun run deploy:convex`) from the repo root. It uses `.env.production` to target production (intent-dolphin-324).
- **Post-deploy:** Run `npm run test:once` and `npm run typecheck` to confirm nothing is broken. Optionally run one agent call against production (e.g. from the app or a test script) to smoke-test the deployment.

### Test production

1. **Local checks** (no production needed): run `npm run typecheck` and `npm run test:once` to validate the codebase.
2. **Production smoke test:** run `npm run test:production:smoke` from the repo root. This loads `.env.production` and runs one agent call (`agents/actions:testAgent`) against the deployed Convex backend. Requires `.env.production` with the production Convex deployment (e.g. `CONVEX_DEPLOYMENT`). Production Convex must have required env vars (e.g. `OPENROUTER_API_KEY`) set in the Convex Dashboard.
3. **Column tests** (`bun run scripts/run-column-tests.ts`) POST to `/api/test/column`, which returns 404 in production. Use them for pre-production or a separate dev/staging deployment only. To run column tests against production you would need a different mechanism (e.g. a Convex action enabled in prod and secured).

**One-command deploy and test:** `npm run deploy:convex:and-test` runs deploy, then typecheck, test:once, and test:production:smoke in order.

## Web (Vercel)

1. Import this repo on Vercel.
2. Set **Root Directory** to `web`.
3. Add env vars: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_SITE_URL`.

## Admin (Vercel)

1. Import this repo again (or use Vercel Teams for multiple projects).
2. Set **Root Directory** to `admin`.
3. Add env vars: `NEXT_PUBLIC_CONVEX_URL`.

## Mobile (EAS)

1. From `mobile/`: `eas build --platform all`
2. For **production** builds: set `EXPO_PUBLIC_CONVEX_URL` (and `EXPO_PUBLIC_SITE_URL` if used) in EAS secrets to the **production** Convex URLs (e.g. `https://intent-dolphin-324.convex.cloud`). Local dev uses `mobile/.env` (dev Convex URLs).
