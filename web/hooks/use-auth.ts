"use client";

/**
 * useAuth Hook
 * Provides auth state and actions for the frontend
 */

import { useSession, signIn, signOut } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export interface UseAuthReturn {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    phoneNumber?: string | null;
    phoneNumberVerified?: boolean | null;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const user: UseAuthReturn["user"] = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        phoneNumber: (session.user as { phoneNumber?: string | null }).phoneNumber,
        phoneNumberVerified: (session.user as { phoneNumberVerified?: boolean | null })
          .phoneNumberVerified,
      }
    : null;

  const logout = useCallback(async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  return {
    user,
    isLoading: isPending,
    isAuthenticated: !!user,
    logout,
  };
}

export default useAuth;
