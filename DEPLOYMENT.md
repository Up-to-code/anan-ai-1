# Deployment (Monorepo)

Single repo: convex, web, admin, mobile.

## Convex

- **CI:** `.github/workflows/deploy-convex.yml` deploys on push to `main` when `convex/` changes.
- **Secret:** `CONVEX_DEPLOY_KEY` (from Convex Dashboard → Project Settings).

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
2. Configure `EXPO_PUBLIC_CONVEX_URL` in EAS secrets.
