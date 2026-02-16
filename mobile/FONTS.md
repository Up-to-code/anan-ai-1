# Fonts (Expo) – عنان AI Mobile

The app uses **Cairo** for Arabic UI, loaded via `expo-font` and `@expo-google-fonts/cairo`.

## Current setup

- **Packages:** `expo-font`, `@expo-google-fonts/cairo`
- **Loading:** In `App.tsx`, `useFonts({ Cairo_400Regular, Cairo_500Medium, Cairo_700Bold })` loads fonts before the app renders. A loading screen is shown until fonts are ready or an error occurs.
- **Theme:** `src/theme.ts` exposes `fontFamily: { regular: "Cairo_400Regular", medium: "Cairo_500Medium", bold: "Cairo_700Bold" }`. Use these via `useThemedTheme()` in components so text uses Cairo.

## How to add more fonts (or another Google font)

1. **Install**
   ```bash
   npx expo install expo-font
   npx expo install @expo-google-fonts/<name>   # e.g. @expo-google-fonts/inter
   ```

2. **Load in App.tsx**
   - Import the font map from the package and `useFonts` from `expo-font` (or keep using `@expo-google-fonts/cairo`’s `useFonts` if you only add more weights).
   - Call `useFonts({ ...fontMap })` and do not render the main app until `fontsLoaded` is true or `fontError` is set. Show a loading view or splash until then.

3. **Optional: keep splash visible until fonts load**
   ```bash
   npx expo install expo-splash-screen
   ```
   - In `App.tsx`: call `SplashScreen.preventAutoHideAsync()` early (e.g. at top level or in a useEffect).
   - After fonts load (or error), call `SplashScreen.hideAsync()` so the splash hides and the app appears.

4. **Use in theme and components**
   - Add the new family name(s) to `src/theme.ts` in the `fontFamily` object.
   - In components, use `const theme = useThemedTheme();` and set `fontFamily: theme.fontFamily.xxx` in text styles so the whole app stays consistent.

## Adding extra Cairo weights

To add e.g. Cairo SemiBold:

1. Check if `@expo-google-fonts/cairo` exports it (e.g. `Cairo_600SemiBold`).
2. Add it to the `useFonts({ ... })` call in `App.tsx`.
3. Add a key to `fontFamily` in `src/theme.ts`, e.g. `semiBold: "Cairo_600SemiBold"`.
4. Use `theme.fontFamily.semiBold` in styles where needed.

## Do not

- Use raw `fontWeight` without `fontFamily` for body/titles; the app uses Cairo, so use `fontFamily: theme.fontFamily.regular | medium | bold` to get the correct weight.
