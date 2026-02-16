/**
 * Better Auth + Convex client for Expo. Uses expo-secure-store for session persistence.
 */
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { phoneNumberClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

const baseURL =
  process.env.EXPO_PUBLIC_SITE_URL ??
  process.env.EXPO_PUBLIC_APP_URL ??
  "http://localhost:3000";

const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({
      scheme: "anan",
      storagePrefix: "anan",
      storage: SecureStore,
    }),
    convexClient(),
    phoneNumberClient(),
  ],
});

export { authClient };
export const useSession = authClient.useSession;
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;
export const $fetch = authClient.$fetch;
