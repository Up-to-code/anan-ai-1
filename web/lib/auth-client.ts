/**
 * Better Auth + Convex client
 * Uses Convex as the auth backend
 */

import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { phoneNumberClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  plugins: [convexClient(), phoneNumberClient()],
});

export const { signIn, signUp, signOut, useSession, $fetch } = authClient;
