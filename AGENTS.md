# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

anan-ai is a real estate AI assistant platform (Arabic/Saudi market). It uses a Convex serverless backend with AI agents, a Next.js admin dashboard, and (not in this checkout) a consumer web app and Expo mobile app.

### Available services

| Service | Directory | Start command | Port |
|---------|-----------|---------------|------|
| Convex backend | `convex/` | `npx convex dev` | cloud-hosted |
| Admin dashboard | `admin/` | `npm run dev:admin` | 3002 |

The `web/` and `mobile/` directories are referenced in README but not present in this checkout.

### Key development commands

See `package.json` scripts. The most important:

- **Type check:** `npm run typecheck` (or `npx tsc --noEmit`)
- **Lint:** `npm run lint`
- **Unit tests:** `npm run test:once` (vitest)
- **Admin dev:** `npm run dev:admin` (Next.js on port 3002)
- **Convex dev:** `npm run dev:backend` (requires Convex auth)

### Gotchas & non-obvious notes

- **npm install requires `--legacy-peer-deps`:** The `@browserbasehq/convex-stagehand` package pins `zod@^3.23.0` but the project uses `zod@^4.3.6`. Always use `npm install --legacy-peer-deps`.
- **Admin symlink:** The admin app resolves `convex/_generated/*` via webpack/turbopack aliases pointing to a local `convex/` directory. A symlink `admin/convex -> ../convex` must exist for the admin dev server to compile. Create it with `ln -sf ../convex admin/convex`.
- **Admin uses bun:** The admin app uses `bun` as its package manager (has `bun.lock`). Install deps with `bun install` inside `admin/`.
- **Admin `.env.local`:** The admin needs `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_SITE_URL` in `admin/.env.local`. Copy from `admin/.env.example`.
- **Convex authentication:** Running `npx convex dev` requires interactive Convex CLI login. In CI, use `CONVEX_DEPLOY_KEY`. Without a Convex deployment, the admin UI compiles and renders but cannot connect to the backend.
- **Root `.gitignore` includes `admin/`:** Admin files were force-added to git. When adding new admin files, use `git add -f admin/path/to/file`.
- **Pre-existing test failures:** 4 tests in `convex/agents/anan/` fail due to timestamp non-determinism and missing assertions. These are not caused by the environment setup.
- **Pre-existing lint warnings:** ESLint reports ~200 warnings and ~78 errors (mostly in `tests/` and `scripts/`). These are pre-existing in the codebase.
