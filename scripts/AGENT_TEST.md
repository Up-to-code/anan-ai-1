# Set Convex env and test agent (curl / app form)

## 1. Set env in Convex

From the repo root, run (replace values if needed):

```bash
# Local model (LLM Studio). Use with: npx convex dev --local
npx convex env set LLM_MODE local
npx convex env set LLM_BASE_URL "http://127.0.0.1:1234/v1"
npx convex env set LLM_MODEL "google/gemma-3-4b"

# Or OpenRouter
# npx convex env set LLM_MODE openrouter
# npx convex env set OPENROUTER_API_KEY "your-key"
# npx convex env set OPENROUTER_MODEL "stepfun/step-3.5-flash:free"
```

Or set them in **Convex Dashboard** → your deployment → **Settings** → **Environment Variables**.

## 2. Test agent with curl (terminal)

Your Convex HTTP endpoint is the **site URL** (e.g. `https://YOUR-DEPLOYMENT.convex.site`). Get it from the dashboard or from `.env.local` / `VITE_CONVEX_SITE_URL`.

```bash
export CONVEX_SITE_URL="https://YOUR-DEPLOYMENT.convex.site"

curl -X POST "${CONVEX_SITE_URL}/api/test/agent-reply" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me find apartments in Riyadh?", "userId": "curl-test"}'
```

Or one line (replace the URL):

```bash
curl -X POST "https://YOUR-DEPLOYMENT.convex.site/api/test/agent-reply" -H "Content-Type: application/json" -d '{"message": "Hello"}'
```

## 3. Test from app (agent form)

Use the agent UI in your app (web/mobile). It calls the same Convex backend; no extra config if the app is already pointed at your deployment. Ensure `CONVEX_SITE_URL` / `VITE_CONVEX_SITE_URL` (or your app’s Convex URL) matches the deployment where you set the env vars.
