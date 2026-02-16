# عنان AI – Mobile (Expo)

Expo app for عنان AI. Same backend (Convex + Better Auth) as the web app. React Native styling only (no Tailwind). Auth sessions stored with `expo-secure-store`.

## Setup

1. From repo root, ensure Convex is running: `npm run dev:backend` (or `npx convex dev`).
2. Copy env example and set your Convex URL and (optional) site URL for auth:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   - `EXPO_PUBLIC_CONVEX_URL` – your Convex deployment URL (e.g. from `npx convex dashboard` or root `.env`).
   - `EXPO_PUBLIC_SITE_URL` – web app URL for Better Auth (e.g. `http://localhost:3000` when running the web app).

3. Install and start:
   ```bash
   npm install --legacy-peer-deps
   npm start
   ```

## Scripts

- `npm start` – start Expo dev server
- `npm run ios` – run on iOS simulator
- `npm run android` – run on Android emulator

## Convex

The app uses the Convex backend at repo root (`../convex`). Metro is configured to watch the parent directory so `../../convex/_generated/api` resolves from `src/convex.ts`. Run `npx convex dev` from the **repo root** to regenerate the API.

## Fonts

The app uses **Cairo** (Expo + `@expo-google-fonts/cairo`). See [FONTS.md](./FONTS.md) for how fonts are loaded and how to add more fonts or weights.

## E2E tests (Maestro)

See [.maestro/README.md](.maestro/README.md) for how to install Maestro CLI and run flows. From `mobile/` run:

```bash
maestro test .maestro/
```

Logs appear in the terminal; fix any failing steps in the app or in the flow YAML, then re-run until tests pass.

## App Store (Apple)

- **Privacy manifest:** `app.json` includes `ios.privacyManifests` for required API reasons (e.g. UserDefaults, file timestamp). Add or adjust entries per [Expo Apple privacy](https://docs.expo.dev/guides/apple-privacy/).
- **Privacy policy:** App Store Connect requires a privacy policy URL. Host a page describing what data the app collects and how it is used, then add the URL in App Store Connect.
- **Icons & metadata:** Ensure `assets/icon.png` and splash meet Apple’s size requirements. In App Store Connect, set category, description, keywords, and support URL.
