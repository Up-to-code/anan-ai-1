# Maestro E2E tests

[Maestro](https://maestro.dev) is used for end-to-end UI testing on iOS and Android.

## Install Maestro CLI

- **macOS (Homebrew):** `brew install maestro`
- **Or install script:** `curl -Ls "https://get.maestro.mobile.dev" | bash`

Ensure `maestro` is on your PATH. Without this, E2E tests cannot run.

## Run tests

1. Build and install the app on a simulator/emulator (e.g. `npx expo run:ios` from `mobile/` so the app with `com.anan.mobile` is installed).
2. From the **mobile** directory:
   ```bash
   bun run e2e
   ```
   or:
   ```bash
   maestro test .maestro/
   ```
3. Logs are printed to the terminal. Failed steps show which assertion or tap failed.
4. Fix either the app (missing label, wrong text, RTL) or the flow (selector/order), then re-run until the critical flows pass.

## Flows

- **main.yaml** – Launch app, assert header title "عنان".
- **conversations.yaml** – Open conversations drawer, assert "محادثة جديدة" and search placeholder.
- **profile.yaml** – Open drawer → Account and Settings → Profile; assert "الملف الشخصي", "الاسم", "رقم الهاتف".
- **auth.yaml** – Open drawer → Login; assert auth screen and phone field.

## Logs

Maestro prints each step and pass/fail to stdout. Use `maestro test .maestro/ --format junit` (or similar) if you need CI-friendly output.
