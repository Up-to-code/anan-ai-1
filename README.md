# anan-ai (عنان)

One monorepo for the Anan real estate AI project. Convex backend + web app + admin dashboard + mobile app.

## Structure

| Folder   | App         | Tech              |
|----------|-------------|-------------------|
| `convex/`| Backend     | Convex, agents    |
| `web/`   | Consumer    | Next.js 16        |
| `admin/` | Admin       | Next.js 16        |
| `mobile/`| Mobile      | Expo, React Native|

## Get started

```bash
npm install
npm run dev
```

This starts Convex and the web app. Other commands:

| Command       | Description                    |
|---------------|--------------------------------|
| `npm run dev:backend` | Convex only              |
| `npm run dev:web`     | Web app (port 3000)      |
| `npm run dev:admin`   | Admin (port 3002)        |
| `npm run dev:mobile`  | Mobile (Expo)            |

**First-time Convex setup:** Run `npx convex dev` and follow the prompts to log in and create a project.

## Environment setup

1. Copy env template and fill values:

```
cp .env.example .env.local
```

2. Start local Convex and push env values from `.env.local`:

```
npx convex dev
```

3. For deployed environments, set the same keys in Convex Dashboard > Settings > Environment Variables.

Required keys for agent web automation:
- `OPENROUTER_API_KEY` (or `MODEL_API_KEY`)
- `BROWSERBASE_API_KEY`
- `BROWSERBASE_PROJECT_ID`

Optional key for web search fallback:
- `SERPER_API_KEY`

If you're reading this README on GitHub and want to use this template, run:

```
npm create convex@latest -- -t react-vite-shadcn
```

## Deployment (one repo)

- **Convex:** GitHub Actions deploys on push to `main` when `convex/` changes. Set `CONVEX_DEPLOY_KEY` in repo secrets.
- **Web & Admin:** Connect this repo to [Vercel](https://vercel.com). Create two projects: one with root directory `web/`, one with `admin/`.
- **Mobile:** Build with EAS from `mobile/`. See `mobile/README.md`.

## Learn more

- [Convex docs](https://docs.convex.dev/)
- [Expo docs](https://docs.expo.dev/)
