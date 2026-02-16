---
name: anan-mobile-ui
description: Applies anan mobile app UI conventions, design system, and checklist for fixing missing or inconsistent UI. Use when working on the React Native mobile app in mobile/, fixing UI issues, adding screens or components, or when the user asks about mobile UI, design system, accessibility, or missing UI elements.
---

# Anan mobile UI

Use this skill when working on the **mobile** app (React Native in `mobile/`): fixing missing UI, keeping design consistent, or adding new screens/components.

## Design system

- **Theme**: [mobile/src/theme.ts](mobile/src/theme.ts)
  - Use `useThemedTheme()` in components for mode-aware colors, radius, spacing, fontSize.
  - `getTheme(mode)` for one-off use (e.g. navigator). Light/dark palettes; radius scale `sm`–`full`; spacing `xs`–`3xl`.
- **Components**: [mobile/src/components/](mobile/src/components/)
  - **Button**: Primary/secondary, `radius.lg`, optional `accessibilityLabel`.
  - **Input**: Themed TextInput wrapper, `radius.lg`, supports `writingDirection` and `accessibilityLabel` via props.
  - **Chip**: Touchable suggestion chip, `radius.lg`, optional `accessibilityLabel` (defaults to children).
- **Screens**: Use `createStyles(theme)` with `useMemo(() => createStyles(theme), [theme])` so styles update when theme toggles. All tokens from theme (no hardcoded colors or spacing).

## Fixing missing / inconsistent UI

When fixing "missing" or "all UI things", work through this checklist:

### 1. Theme and StatusBar

- StatusBar must follow theme: light content on dark background (`style="light"`), dark content on light background (`style="dark"`). Handled in App via `ThemeAwareStatusBar`; do not set a fixed `StatusBar` style elsewhere.
- Every screen that shows content must use `useThemedTheme()` and theme tokens for colors, radius, spacing.

### 2. Accessibility

- **Interactive elements**: Add `accessibilityLabel` (and `accessibilityRole="button"` for buttons) on:
  - Buttons (including send, submit, nav actions).
  - Chips and list row taps.
  - Inputs (message field, phone, search).
- Use **Arabic** labels when they match the visible text (e.g. إرسال, حقل الرسالة, رقم الهاتف, متابعة, محادثة جديدة, بحث في المحادثات, حذف المحادثة, الإعدادات, تسجيل الدخول).
- Button and Chip components accept optional `accessibilityLabel`; Input passes through `accessibilityLabel` via `TextInputProps`.

### 3. Layout and safe area

- App uses `SafeAreaProvider` in [mobile/App.tsx](mobile/App.tsx). Use safe area insets in screens if content must avoid notches/home indicator (e.g. bottom input bar).
- Chat input: single pill-shaped bar (`inputBar`), no top border; send button inside bar on the left. No extra options/actions not in the design.

### 4. Loading and error states

- Async actions (send message, create thread, auth, delete) must show loading (disabled buttons, `ActivityIndicator` where appropriate) and clear error feedback (inline text or alert). Never leave buttons enabled while a request is in flight without indication.

### 5. RTL and Arabic

- RTL is forced in App (`I18nManager.forceRTL(true)`). Use `textAlign: "right"` and `writingDirection="rtl"` on Arabic text inputs. Placeholder and labels in Arabic where the UI is Arabic.

### 6. Consistency

- New screens: same container padding (`spacing.lg` or `xl`), same title/subtitle typography (theme `fontSize`, `colors.foreground` / `colors.mutedForeground`).
- New buttons/inputs: use shared `Button` and `Input` (and `Chip` for suggestion chips) so radius, spacing, and theme stay consistent.

## Key files

| Purpose | Path |
|--------|------|
| Theme & hooks | [mobile/src/theme.ts](mobile/src/theme.ts) |
| Theme mode context | [mobile/src/contexts/ThemeContext.tsx](mobile/src/contexts/ThemeContext.tsx) |
| Shared components | [mobile/src/components/](mobile/src/components/) |
| Screens | [mobile/src/screens/](mobile/src/screens/) |
| Navigation & header theme | [mobile/src/navigation/RootNavigator.tsx](mobile/src/navigation/RootNavigator.tsx) |
| App entry, StatusBar, RTL | [mobile/App.tsx](mobile/App.tsx) |

## Quick reference

- **Add a new screen**: Use `useThemedTheme()`, `createStyles(theme)`, `useMemo` for styles. Use `Button`/`Input`/`Chip` where applicable. Add `accessibilityLabel` (and `accessibilityRole` for buttons) to interactive elements.
- **Fix “missing UI”**: Run through the checklist above (theme/StatusBar, accessibility, safe area, loading/error, RTL, consistency).
- **Match design**: Pill-shaped chat input bar (one wrapper, send inside left); no extra buttons. Use theme tokens only; no hardcoded colors or radii.
