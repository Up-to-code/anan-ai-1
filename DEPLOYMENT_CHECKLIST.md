# Deployment readiness checklist

## Files present

| File | Status |
|------|--------|
| `.github/workflows/deploy-convex.yml` | OK – deploys Convex on `convex/` changes |
| `.github/workflows/build.yml` | OK – builds web + admin on push |
| `convex.json` | OK – `{"functions":"convex/"}` |
| `web/vercel.json` | OK – Next.js config |
| `admin/vercel.json` | OK – Next.js config |
| `mobile/eas.json` | OK – EAS build profiles |
| `DEPLOYMENT.md` | OK – deployment instructions |
| `.env.example` | OK – template (secrets removed) |

## GitHub Actions secrets

Set in **Settings → Secrets and variables → Actions**:

| Secret | Required for | Get from |
|--------|--------------|----------|
| `CONVEX_DEPLOY_KEY` | Convex deploy | Convex Dashboard → Project Settings |
| `NEXT_PUBLIC_CONVEX_URL` | Build jobs (optional; fallback used) | Convex deployment URL |

## Pre-push checklist

1. [ ] All changes committed
2. [ ] No `.env` or `.env.local` committed (ignored by `.gitignore`)
3. [ ] `CONVEX_DEPLOY_KEY` added to GitHub secrets
4. [ ] Remote points to your repo: `git remote -v`

## After push to `main`

- **Convex:** Auto-deploys when `convex/` changes
- **Build:** Web and admin builds run (verify in Actions tab)
- **Vercel:** Connect repo, set Root Directory to `web` or `admin`
- **Mobile:** Build from `mobile/` with `eas build`
