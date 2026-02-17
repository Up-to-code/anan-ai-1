# anan-ai (عنان)

Real estate AI assistant — Convex backend, Next.js web app, admin dashboard, and Expo mobile app.

## Structure

| Folder    | App      | Tech               |
|-----------|----------|--------------------|
| `convex/` | Backend  | Convex, agents     |
| `web/`    | Consumer | Next.js, React     |
| `admin/`  | Admin    | Next.js            |
| `mobile/` | Mobile   | Expo, React Native |

## Get started

```bash
npm install
npm run dev
```

Starts Convex and the web app. Other commands:

| Command             | Description            |
|---------------------|------------------------|
| `npm run dev:backend` | Convex only          |
| `npm run dev:web`     | Web app (port 3000) |
| `npm run dev:admin`   | Admin (port 3002)   |
| `npm run dev:mobile`  | Mobile (Expo)       |
| `npm run deploy:convex` | Deploy Convex to prod |

**First-time Convex setup:** Run `npx convex dev` and follow the prompts to log in and create a project.

## Environment

1. Copy the template and fill values:

```bash
cp .env.example .env.local
```

2. Run Convex and push env from `.env.local`:

```bash
npx convex dev
```

3. For production, set variables in Convex Dashboard → Settings → Environment Variables.

### Required for agent + web automation

- `OPENROUTER_API_KEY` (or `MODEL_API_KEY`)
- `BROWSERBASE_API_KEY`
- `BROWSERBASE_PROJECT_ID`

### Optional

- `SERPER_API_KEY` — web search fallback

## Deployment

- **Convex:** `npm run deploy:convex` (uses `.env.production`). Or deploy via GitHub Actions on push to `main` when `convex/` changes; set `CONVEX_DEPLOY_KEY` in repo secrets.
- **Web & Admin:** Deploy via Vercel. Create separate projects with root directories `web/` and `admin/`.
- **Mobile:** Build with EAS from `mobile/`. See `mobile/README.md`.

## Learn more

- [Convex docs](https://docs.convex.dev/)
- [Expo docs](https://docs.expo.dev/)
